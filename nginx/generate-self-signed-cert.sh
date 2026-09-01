#!/usr/bin/env bash
# Generate a self-signed TLS cert for HTTPS (mobile browsers require it).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$DIR/certs"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$DIR/certs/privkey.pem" \
  -out "$DIR/certs/fullchain.pem" \
  -subj "/CN=ridge.sslip.io/O=RIDGE/C=IN"
echo "Created $DIR/certs/fullchain.pem"
