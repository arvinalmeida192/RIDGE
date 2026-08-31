#!/usr/bin/env bash
# Add swap for 1 GB VMs (AWS t2.micro, GCP e2-micro, etc.)
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "Run as root: sudo bash $0"; exit 1; }

SWAP_GB="${SWAP_GB:-4}"
SWAP_FILE="/swapfile"

if swapon --show | grep -q "${SWAP_FILE}"; then
  echo "Swap already enabled on ${SWAP_FILE}"
  free -h
  exit 0
fi

echo "Creating ${SWAP_GB}G swap at ${SWAP_FILE}..."
fallocate -l "${SWAP_GB}G" "${SWAP_FILE}" 2>/dev/null || dd if=/dev/zero of="${SWAP_FILE}" bs=1M count=$((SWAP_GB * 1024)) status=progress
chmod 600 "${SWAP_FILE}"
mkswap "${SWAP_FILE}"
swapon "${SWAP_FILE}"

if ! grep -q "${SWAP_FILE}" /etc/fstab; then
  echo "${SWAP_FILE} none swap sw 0 0" >> /etc/fstab
fi

sysctl vm.swappiness=10
grep -q '^vm.swappiness' /etc/sysctl.conf 2>/dev/null \
  && sed -i 's/^vm.swappiness.*/vm.swappiness=10/' /etc/sysctl.conf \
  || echo 'vm.swappiness=10' >> /etc/sysctl.conf

echo "Swap ready:"
free -h
