#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   BACKUP_FILE=backup-20251121-020001.dump.gz.enc \
#   BACKUP_ENCRYPTION_KEY="your_passphrase" \
#   DB_HOST=localhost DB_PORT=5432 DB_USER=postgres DB_NAME=dkee_restore \
#   ./scripts/restore_db.sh
#
# Expects checksum file alongside encrypted file: backup-*.sha256 (optional)
# Restores into target database (must exist). Use -c flag in pg_restore for clean overwrite.

if [[ -z "${BACKUP_FILE:-}" ]]; then
  echo "BACKUP_FILE not set" >&2; exit 1
fi
if [[ -z "${DB_HOST:-}" || -z "${DB_PORT:-}" || -z "${DB_USER:-}" || -z "${DB_NAME:-}" ]]; then
  echo "DB_HOST/DB_PORT/DB_USER/DB_NAME must be set" >&2; exit 1
fi

CHECKSUM_FILE="${BACKUP_FILE}.sha256"

if [[ -f "$CHECKSUM_FILE" ]]; then
  echo "Verifying checksum..."
  # sha256 format: <hash> <filename>
  sha256sum -c "$CHECKSUM_FILE"
else
  echo "Checksum file missing; skipping integrity verification" >&2
fi

DECRYPTED_GZ="${BACKUP_FILE%.enc}" # strip .enc
if [[ "$BACKUP_FILE" == *.enc ]]; then
  if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
    echo "BACKUP_ENCRYPTION_KEY not set for encrypted file" >&2; exit 1
  fi
  echo "Decrypting $BACKUP_FILE -> $DECRYPTED_GZ"
  openssl enc -d -aes-256-cbc -pbkdf2 -in "$BACKUP_FILE" -out "$DECRYPTED_GZ" -pass pass:"$BACKUP_ENCRYPTION_KEY"
else
  echo "File not encrypted; assuming gzip format"
  DECRYPTED_GZ="$BACKUP_FILE"
fi

RAW_DUMP="${DECRYPTED_GZ%.gz}" # strip .gz
if [[ "$DECRYPTED_GZ" == *.gz ]]; then
  echo "Decompressing $DECRYPTED_GZ -> $RAW_DUMP"
  gunzip -f "$DECRYPTED_GZ"
fi

if [[ ! -f "$RAW_DUMP" ]]; then
  echo "Restorable dump not found: $RAW_DUMP" >&2; exit 1
fi

echo "Restoring into $DB_NAME on $DB_HOST:$DB_PORT"
PGPASSWORD="${PGPASSWORD:-}" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$RAW_DUMP"

echo "Restore complete."