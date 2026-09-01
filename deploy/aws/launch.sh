#!/usr/bin/env bash
# Launch RIDGE on AWS Free Tier (EC2 t3.micro + Docker Compose).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REGION="${AWS_REGION:-ap-south-1}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.micro}"
KEY_NAME="${KEY_NAME:-ridge-deploy-key}"
SG_NAME="${SG_NAME:-ridge-prod-sg}"
INSTANCE_NAME="${INSTANCE_NAME:-ridge-prod}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ridge-aws}"
STATE_FILE="${STATE_FILE:-$ROOT/deploy/aws/.deploy-state}"
REPO_URL="${REPO_URL:-https://github.com/arvinalmeida192/RIDGE.git}"

die() { echo "ERROR: $*" >&2; exit 1; }

require_aws() {
  aws sts get-caller-identity >/dev/null 2>&1 || die "AWS CLI not configured. Run: aws configure"
}

ensure_ssh_key() {
  if [[ ! -f "$SSH_KEY" || ! -f "${SSH_KEY}.pub" ]]; then
    echo "Generating SSH key at $SSH_KEY"
    ssh-keygen -t ed25519 -f "$SSH_KEY" -N "" -C "ridge-aws-deploy"
  fi
}

import_key_pair() {
  if aws ec2 describe-key-pairs --region "$REGION" --key-names "$KEY_NAME" >/dev/null 2>&1; then
    echo "Key pair $KEY_NAME already exists in AWS" >&2
    return
  fi
  aws ec2 import-key-pair \
    --region "$REGION" \
    --key-name "$KEY_NAME" \
    --public-key-material "fileb://${SSH_KEY}.pub"
  echo "Imported key pair: $KEY_NAME" >&2
}

ensure_security_group() {
  local vpc_id sg_id my_ip
  vpc_id="$(aws ec2 describe-vpcs --region "$REGION" --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
  [[ "$vpc_id" != "None" && -n "$vpc_id" ]] || die "No default VPC in $REGION. Create one or set a custom VPC."

  sg_id="$(aws ec2 describe-security-groups --region "$REGION" \
    --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$vpc_id" \
    --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)"

  if [[ -z "$sg_id" || "$sg_id" == "None" ]]; then
    sg_id="$(aws ec2 create-security-group --region "$REGION" \
      --group-name "$SG_NAME" \
      --description "RIDGE production HTTP/SSH" \
      --vpc-id "$vpc_id" \
      --query 'GroupId' --output text)"
    echo "Created security group: $sg_id" >&2
  else
    echo "Using security group: $sg_id" >&2
  fi

  my_ip="$(curl -fsS https://checkip.amazonaws.com | tr -d '\n')"
  aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$sg_id" \
    --ip-permissions \
    "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=${my_ip}/32,Description=SSH}]" \
    >/dev/null 2>&1 || true
  aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$sg_id" \
    --ip-permissions \
    "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTP}]" \
    >/dev/null 2>&1 || true
  aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$sg_id" \
    --ip-permissions \
    "IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTPS}]" \
    >/dev/null 2>&1 || true

  echo "$sg_id"
}

get_ubuntu_ami() {
  aws ec2 describe-images --region "$REGION" \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" "Name=state,Values=available" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text
}

launch_instance() {
  local sg_id ami_id instance_id
  sg_id="$1"
  ami_id="$(get_ubuntu_ami)"
  [[ "$ami_id" != "None" && -n "$ami_id" ]] || die "Could not find Ubuntu 22.04 AMI in $REGION"

  instance_id="$(aws ec2 run-instances --region "$REGION" \
    --image-id "$ami_id" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$sg_id" \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --user-data "file://$ROOT/deploy/aws/ec2-user-data.sh" \
    --query 'Instances[0].InstanceId' \
    --output text)"

  [[ "$instance_id" =~ ^i- ]] || die "Failed to launch EC2 instance (got: '$instance_id')"
  echo "Launched instance: $instance_id" >&2
  aws ec2 wait instance-running --region "$REGION" --instance-ids "$instance_id"
  echo "$instance_id"
}

allocate_elastic_ip() {
  local instance_id="$1"
  local alloc_id public_ip existing

  # Reuse an unassociated Elastic IP if one exists (avoids extra charges)
  existing="$(aws ec2 describe-addresses --region "$REGION" \
    --filters "Name=domain,Values=vpc" \
    --query 'Addresses[?InstanceId==`null`].AllocationId | [0]' --output text)"
  if [[ -n "$existing" && "$existing" != "None" ]]; then
    alloc_id="$existing"
    echo "Reusing unassociated Elastic IP: $alloc_id" >&2
  else
    alloc_id="$(aws ec2 allocate-address --region "$REGION" --domain vpc --query 'AllocationId' --output text)"
    echo "Allocated new Elastic IP: $alloc_id" >&2
  fi

  aws ec2 associate-address --region "$REGION" --instance-id "$instance_id" --allocation-id "$alloc_id" >/dev/null
  public_ip="$(aws ec2 describe-addresses --region "$REGION" --allocation-ids "$alloc_id" --query 'Addresses[0].PublicIp' --output text)"
  echo "$public_ip"
}

wait_for_ssh() {
  local host="$1"
  echo "Waiting for SSH on $host (bootstrap may take 2–3 min)..."
  for _ in $(seq 1 60); do
    if ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 -i "$SSH_KEY" "ubuntu@${host}" "test -f /var/log/ridge-bootstrap.done" 2>/dev/null; then
      echo "Bootstrap complete."
      return 0
    fi
    sleep 10
  done
  die "Timed out waiting for EC2 bootstrap on $host"
}

build_production_env() {
  local tmp env_src="$ROOT/.env"
  tmp="$(mktemp)"
  [[ -f "$env_src" ]] || die "Missing $env_src — copy .env.example to .env first"

  python3 - "$env_src" "$tmp" <<'PY'
import os, re, secrets, sys
src, dst = sys.argv[1], sys.argv[2]
lines = open(src).read().splitlines()
out = {}
for line in lines:
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    out[k] = v

out["NODE_ENV"] = "production"
out["HTTP_PORT"] = "80"
out["DB_MIGRATE_ON_START"] = "true"
out["DB_SEED_ON_START"] = os.environ.get("DB_SEED_ON_START", "true")
out["LEGACY_LOGIN_ENABLED"] = "false"
out["FIREBASE_SERVICE_ACCOUNT_PATH"] = "serviceAccountKey.json"

if out.get("DB_PASSWORD", "").startswith("ridge_dev") or out.get("DB_PASSWORD") == "change-me":
    out["DB_PASSWORD"] = secrets.token_urlsafe(24)
if "change-me" in out.get("JWT_SECRET", ""):
    out["JWT_SECRET"] = secrets.token_urlsafe(48)

# Docker compose overrides host-specific URLs
out.pop("PORT", None)
out.pop("DATABASE_URL", None)
out.pop("REDIS_URL", None)
out.pop("ML_SERVICE_URL", None)

with open(dst, "w") as f:
    for k in sorted(out):
        f.write(f"{k}={out[k]}\n")
PY
  echo "$tmp"
}

deploy_app() {
  local host="$1"
  local env_file
  env_file="$(build_production_env)"

  [[ -f "$ROOT/serviceAccountKey.json" ]] || echo '{}' > "$ROOT/serviceAccountKey.json"

  ssh -o StrictHostKeyChecking=accept-new -i "$SSH_KEY" "ubuntu@${host}" bash -s <<REMOTE
set -euo pipefail
if [ ! -d /opt/ridge/.git ]; then
  git clone "$REPO_URL" /opt/ridge
else
  cd /opt/ridge && git pull --ff-only
fi
REMOTE

  scp -o StrictHostKeyChecking=accept-new -i "$SSH_KEY" "$env_file" "ubuntu@${host}:/opt/ridge/.env"
  scp -o StrictHostKeyChecking=accept-new -i "$SSH_KEY" "$ROOT/serviceAccountKey.json" "ubuntu@${host}:/opt/ridge/serviceAccountKey.json"
  rm -f "$env_file"

  ssh -i "$SSH_KEY" "ubuntu@${host}" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/ridge
export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1
nohup sudo docker compose -f docker-compose.prod.yml up -d --build > /tmp/ridge-deploy.log 2>&1 &
echo "Docker build started in background (takes ~5 min on first run)."
REMOTE
}

main() {
  require_aws
  ensure_ssh_key
  import_key_pair

  if [[ -f "$STATE_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$STATE_FILE"
    if [[ -n "${INSTANCE_ID:-}" && -n "${PUBLIC_IP:-}" ]]; then
      echo "Redeploying to existing instance at $PUBLIC_IP"
      wait_for_ssh "$PUBLIC_IP"
      deploy_app "$PUBLIC_IP"
      echo ""
      echo "=========================================="
      echo "RIDGE deployed: http://${PUBLIC_IP}/"
      echo "SSH: ssh -i $SSH_KEY ubuntu@${PUBLIC_IP}"
      echo "=========================================="
      exit 0
    fi
  fi

  local sg_id instance_id public_ip
  sg_id="$(ensure_security_group)"
  instance_id="$(launch_instance "$sg_id")"
  public_ip="$(allocate_elastic_ip "$instance_id")"

  cat > "$STATE_FILE" <<EOF
INSTANCE_ID=$instance_id
PUBLIC_IP=$public_ip
REGION=$REGION
KEY_NAME=$KEY_NAME
EOF

  wait_for_ssh "$public_ip"
  deploy_app "$public_ip"

  echo ""
  echo "=========================================="
  echo "RIDGE deployed on AWS Free Tier"
  echo "URL:  http://${public_ip}/"
  echo "SSH:  ssh -i $SSH_KEY ubuntu@${public_ip}"
  echo "Logs: ssh -i $SSH_KEY ubuntu@${public_ip} 'cd /opt/ridge && sudo docker compose -f docker-compose.prod.yml logs -f'"
  echo "=========================================="
}

main "$@"
