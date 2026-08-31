#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> RIDGE VM setup"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Install it first:"
  echo "  curl -fsSL https://get.docker.com | sudo sh"
  echo "  sudo usermod -aG docker \$USER && newgrp docker"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin not found."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit it before production deploy."
else
  echo ".env already exists — skipping copy."
fi

if [[ ! -f serviceAccountKey.json ]]; then
  echo '{}' > serviceAccountKey.json
  echo "Created placeholder serviceAccountKey.json"
  echo "  Replace with your Firebase key: scp serviceAccountKey.json user@vm:~/RIDGE/"
fi

if [[ -f .env ]] && grep -q 'change-me-in-production' .env 2>/dev/null; then
  echo ""
  echo "WARNING: .env still has default JWT_SECRET. Generate one:"
  echo "  openssl rand -hex 32"
  echo ""
fi

echo ""
echo "Setup complete. Next steps:"
echo "  1. Edit .env (JWT_SECRET, DB_PASSWORD, Firebase vars)"
echo "  2. Upload real serviceAccountKey.json if using Firebase"
echo "  3. Run: ./scripts/deploy.sh"
