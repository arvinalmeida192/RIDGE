#!/usr/bin/env bash
# Enable HTTPS with Caddy (automatic Let's Encrypt). Run on the VM after deploy-vm.sh.
# Usage: sudo DOMAIN=ridge.example.com EMAIL=you@example.com bash scripts/setup-https.sh
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN=your.domain.com}"
EMAIL="${EMAIL:-}"
RIDGE_DIR="${RIDGE_DIR:-$HOME/RIDGE}"

[[ $EUID -eq 0 ]] || { echo "Run as root"; exit 1; }

cd "${RIDGE_DIR}"

cat > Caddyfile <<EOF
${DOMAIN} {
    encode gzip
    reverse_proxy ridge-nginx:80
}
EOF

# Attach Caddy to the prod network and expose 443
docker network inspect ridge_ridge-net >/dev/null 2>&1 || docker network inspect ridge-net >/dev/null 2>&1
NET="$(docker network ls --format '{{.Name}}' | grep ridge | head -1)"

docker rm -f ridge-caddy 2>/dev/null || true
docker run -d \
  --name ridge-caddy \
  --restart unless-stopped \
  -p 80:80 -p 443:443 \
  -v "$(pwd)/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v caddy_data:/data -v caddy_config:/config \
  --network "${NET}" \
  caddy:2-alpine

echo "HTTPS proxy started for https://${DOMAIN}"
echo "Ensure DNS A record points to this server's public IP."
