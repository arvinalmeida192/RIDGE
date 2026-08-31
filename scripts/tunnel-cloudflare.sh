#!/usr/bin/env bash
# Expose local RIDGE (docker on port 3002) via a free Cloudflare quick tunnel.
# No VM, no Oracle, no account required for basic *.trycloudflare.com URLs.
#
# Usage: bash scripts/tunnel-cloudflare.sh
# Stop:  Ctrl+C
set -euo pipefail

PORT="${RIDGE_PORT:-3002}"
CLOUDFLARED="${CLOUDFLARED:-cloudflared}"

if ! curl -sf "http://127.0.0.1:${PORT}/api/v1/health" >/dev/null 2>&1; then
  echo "RIDGE is not running on port ${PORT}."
  echo "Start it first: docker compose up -d"
  exit 1
fi

if ! command -v "${CLOUDFLARED}" >/dev/null 2>&1; then
  echo "Installing cloudflared..."
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
  chmod +x /tmp/cloudflared
  CLOUDFLARED=/tmp/cloudflared
fi

echo ""
echo "Starting Cloudflare tunnel → http://127.0.0.1:${PORT}"
echo "Your public URL will appear below (copy the https://….trycloudflare.com link)."
echo ""
echo "Firebase: add that hostname to Firebase Console → Auth → Authorized domains."
echo "Press Ctrl+C to stop."
echo ""

exec "${CLOUDFLARED}" tunnel --url "http://127.0.0.1:${PORT}"
