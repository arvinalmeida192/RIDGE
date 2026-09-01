#!/usr/bin/env bash
# Point a free DuckDNS subdomain at the RIDGE server and enable HTTPS.
# 1. Sign up at https://www.duckdns.org (free, ~1 min)
# 2. Create a subdomain (e.g. "ridge-ner" → ridge-ner.duckdns.org)
# 3. Copy your token from the DuckDNS dashboard
# 4. Run:
#      DUCKDNS_SUBDOMAIN=ridge-ner DUCKDNS_TOKEN=your-token ./deploy/aws/setup-duckdns-https.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_FILE="${STATE_FILE:-$ROOT/deploy/aws/.deploy-state}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ridge-aws}"
SUBDOMAIN="${DUCKDNS_SUBDOMAIN:?Set DUCKDNS_SUBDOMAIN (e.g. ridge-ner)}"
TOKEN="${DUCKDNS_TOKEN:?Set DUCKDNS_TOKEN from duckdns.org}"
DOMAIN="${SUBDOMAIN}.duckdns.org"

[[ -f "$STATE_FILE" ]] || { echo "Missing $STATE_FILE — deploy first." >&2; exit 1; }
# shellcheck disable=SC1090
source "$STATE_FILE"
HOST="${PUBLIC_IP:?Missing PUBLIC_IP in state file}"

echo "Updating DuckDNS: $DOMAIN → $HOST"
curl -fsS "https://www.duckdns.org/update?domains=${SUBDOMAIN}&token=${TOKEN}&ip=${HOST}"

echo ""
echo "Waiting for DNS..."
for _ in $(seq 1 12); do
  resolved="$(dig +short "$DOMAIN" 2>/dev/null | head -1)"
  [[ "$resolved" == "$HOST" ]] && break
  sleep 5
done

echo "Installing HTTPS on EC2 for $DOMAIN..."
ssh -i "$SSH_KEY" "ubuntu@${HOST}" bash -s <<REMOTE
set -euo pipefail
sudo apt-get update -qq
sudo apt-get install -y -qq certbot
sudo certbot certonly --standalone -d ${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN} --preferred-challenges http

sudo mkdir -p /opt/ridge/nginx/certs
sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /opt/ridge/nginx/certs/
sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /opt/ridge/nginx/certs/

cat | sudo tee /opt/ridge/nginx/nginx-ssl.conf > /dev/null <<'NGINX'
upstream ridge_server { server server:3000; }
upstream ridge_ml { server ml-service:8000; }

server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    client_max_body_size 2m;

    location / {
        proxy_pass http://ridge_server;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /api/v1/events/alerts {
        proxy_pass http://ridge_server;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
    }
    location /ml/ {
        proxy_pass http://ridge_ml/;
        proxy_set_header Host \$host;
    }
}
NGINX

cd /opt/ridge
sudo docker compose -f docker-compose.prod.yml stop nginx
sudo docker compose -f docker-compose.prod.yml run -d --name ridge-nginx \
  -p 80:80 -p 443:443 \
  -v /opt/ridge/nginx/nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro \
  -v /opt/ridge/nginx/certs:/etc/nginx/certs:ro \
  --network ridge_ridge-net nginx:1.27-alpine
REMOTE

echo ""
echo "=========================================="
echo "HTTPS live: https://${DOMAIN}/"
echo "Add ${DOMAIN} to Firebase Authorized domains"
echo "=========================================="
