#!/usr/bin/env bash
# Deploy RIDGE on a fresh Ubuntu 22.04/24.04 VM (Oracle Cloud, GCP, DigitalOcean, etc.)
set -euo pipefail

RIDGE_DIR="${RIDGE_DIR:-$HOME/RIDGE}"
REPO_URL="${REPO_URL:-https://github.com/arvinalmeida192/RIDGE.git}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

log() { echo "[ridge-deploy] $*"; }
die() { echo "[ridge-deploy] ERROR: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root: sudo bash scripts/deploy-vm.sh"

export DEBIAN_FRONTEND=noninteractive

log "Installing Docker (if needed)..."
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
fi

log "Cloning/updating repository at ${RIDGE_DIR}..."
if [[ -d "${RIDGE_DIR}/.git" ]]; then
  git -C "${RIDGE_DIR}" fetch origin
  git -C "${RIDGE_DIR}" checkout "${BRANCH}"
  git -C "${RIDGE_DIR}" pull origin "${BRANCH}"
else
  git clone --branch "${BRANCH}" "${REPO_URL}" "${RIDGE_DIR}"
fi

cd "${RIDGE_DIR}"

if [[ ! -f .env ]]; then
  log "Creating .env from .env.example — edit secrets before going live!"
  cp .env.example .env
  DB_PASS="$(openssl rand -hex 16)"
  JWT_SECRET="$(openssl rand -hex 32)"
  sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${DB_PASS}/" .env
  sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
  sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' .env
  sed -i 's/^DB_SEED_ON_START=.*/DB_SEED_ON_START=true/' .env
fi

if [[ ! -f serviceAccountKey.json ]]; then
  log "No serviceAccountKey.json — creating placeholder (Firebase disabled until you add a real key)."
  echo '{}' > serviceAccountKey.json
fi

log "Opening firewall ports 80 and 443 (if ufw is active)..."
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q 'Status: active'; then
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 22/tcp
fi

log "Building and starting stack..."
docker compose -f "${COMPOSE_FILE}" up -d --build

log "Waiting for health check..."
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1/api/v1/health >/dev/null 2>&1; then
    log "RIDGE is up!"
    curl -s http://127.0.0.1/api/v1/health | head -c 200
    echo
    PUBLIC_IP="$(curl -sf ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
    log "Dashboard: http://${PUBLIC_IP}/"
    log "Next: add Firebase keys to .env, set FIREBASE_BOOTSTRAP_ADMIN_EMAILS, then:"
    log "  cd ${RIDGE_DIR} && docker compose -f ${COMPOSE_FILE} up -d --force-recreate server"
    exit 0
  fi
  sleep 5
done

die "Health check timed out. Run: docker compose -f ${COMPOSE_FILE} logs server"
