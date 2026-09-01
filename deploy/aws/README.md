# Deploy RIDGE on AWS Free Tier

Runs the full production stack (Postgres/PostGIS, Redis, ML service, Node server, Nginx) on a **t3.micro** EC2 instance with Docker Compose.

## What you need from AWS

1. **IAM access keys** for CLI (not just console login):
   - AWS Console → IAM → Users → your user → Security credentials → **Create access key**
   - Choose "CLI" use case

2. Configure CLI on this machine:

```bash
aws configure
# AWS Access Key ID: <your key>
# AWS Secret Access Key: <your secret>
# Default region: ap-south-1   (Mumbai — change if you prefer)
# Default output format: json
```

3. Ensure your AWS account has a **default VPC** in the chosen region (most accounts do).

## One-command deploy

From the project root:

```bash
chmod +x deploy/aws/launch.sh
./deploy/aws/launch.sh
```

The script will:
- Import an SSH key pair (`~/.ssh/ridge-aws`)
- Create a security group (SSH from your IP, HTTP/HTTPS public)
- Launch **t3.micro** Ubuntu 22.04 (free tier eligible in most regions)
- Attach an Elastic IP (static public address)
- Clone the repo, copy your local `.env` + `serviceAccountKey.json`, and run `docker compose -f docker-compose.prod.yml up -d --build`

First deploy takes **5–10 minutes** (Docker image builds + ML model load).

## After deploy

| Item | Value |
|------|-------|
| App URL | `https://<elastic-ip>/` or `https://ridge.<ip-dashes>.sslip.io/` |
| Health | `https://<elastic-ip>/api/v1/health` |
| SSH | `ssh -i ~/.ssh/ridge-aws ubuntu@<elastic-ip>` |
| Redeploy | Run `./deploy/aws/launch.sh` again (reuses saved instance) |

### Public URL (no domain purchase)

For a readable link without DNS setup, use sslip.io with your Elastic IP (dashes instead of dots):

```
https://ridge.13-203-10-148.sslip.io/
```

HTTPS uses a self-signed certificate (`nginx/generate-self-signed-cert.sh`). Mobile browsers may show a one-time security warning — tap **Advanced → Proceed**.

For a proper certificate (no warning), use a free DuckDNS subdomain:

```bash
DUCKDNS_SUBDOMAIN=ridge-ner DUCKDNS_TOKEN=your-token ./deploy/aws/setup-duckdns-https.sh
```

## Firebase

Your local `.env` and `serviceAccountKey.json` are copied to the server. In Firebase Console → Authentication → Settings → **Authorized domains**, add your public hostname (e.g. `ridge.13-203-10-148.sslip.io` or `ridge-ner.duckdns.org`). Do not include `https://` or paths.

## Scaling beyond one server

See **[SCALING.md](../../SCALING.md)** for staged growth: bigger instances, RDS, load balancing, background workers, and ML scaling.

## Cost notes (free tier)

- **EC2 t3.micro**: 750 hours/month free for 12 months (varies by region)
- **EBS 30 GB**: free tier eligible
- **Elastic IP**: free while attached to a running instance
- Data transfer: 15 GB/month outbound free

## Tear down

```bash
source deploy/aws/.deploy-state
aws ec2 terminate-instances --region "$REGION" --instance-ids "$INSTANCE_ID"
aws ec2 release-address --region "$REGION" --allocation-id "$(aws ec2 describe-addresses --region "$REGION" --filters Name=instance-id,Values=$INSTANCE_ID --query 'Addresses[0].AllocationId' --output text)"
rm deploy/aws/.deploy-state
```
