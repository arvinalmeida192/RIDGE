#!/bin/bash
# EC2 bootstrap — installs Docker, swap, and base tools for RIDGE.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y curl git ufw

# 2 GB swap (t3.micro has only 1 GB RAM; full stack needs headroom)
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /opt/ridge
chown ubuntu:ubuntu /opt/ridge

touch /var/log/ridge-bootstrap.done
