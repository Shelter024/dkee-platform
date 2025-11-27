#!/usr/bin/env bash
set -euo pipefail
# Generates new secrets for NEXTAUTH_SECRET and BACKUP_ENCRYPTION_KEY
echo "Generating NEXTAUTH_SECRET (32 bytes base64)" >&2
NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "Generating BACKUP_ENCRYPTION_KEY (48 bytes hex)" >&2
NEW_BACKUP_ENCRYPTION_KEY=$(openssl rand -hex 48)
echo "--- Paste into secret manager ---"
echo "NEXTAUTH_SECRET=$NEW_NEXTAUTH_SECRET"
echo "BACKUP_ENCRYPTION_KEY=$NEW_BACKUP_ENCRYPTION_KEY"
echo "Rotation complete (apply secrets, restart deployments)."