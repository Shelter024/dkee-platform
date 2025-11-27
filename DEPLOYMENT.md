# Deployment & Operations Guide

## Overview
This document describes how to build, package, deploy, and operate the DK Executive Engineers platform in production.

## 1. Environment Variables
See `.env.example` for all required variables. Copy it to `.env` and set secure values.

Key variables:
- `DATABASE_URL` (Postgres connection string)
- `NEXTAUTH_SECRET` (long random string; rotates with user session invalidation strategy)
- `EXPORT_SECRET` (signing exports; separate from auth secret for compartmentalization)
- `PUSHER_*` (realtime messaging)
- `CLOUDINARY_*` (file uploads)
- `TWILIO_*` (SMS)
- `PAYSTACK_*` (payments)
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (push notifications)
- `REDIS_URL` (caching and rate limiting)

## 2. Database Migrations
Use Prisma migrate for production schema changes:

```bash
npx prisma migrate deploy
```

For local iterative development you may use `prisma db push`, but production requires managed migrations.

## 3. Docker Build
Multi-stage build creates a slim production image.

```bash
docker build -t dkee-app:latest .
docker run --env-file .env -p 3000:3000 dkee-app:latest
```

## 4. Docker Compose (Local Dev)
`docker-compose.yml` provisions Postgres + app:

```bash
docker compose up --build
```

Schema deploy runs automatically via entry command.

## 5. Health Check
`GET /api/health` returns JSON `{ status, db }`. Use in:
- Load balancer target groups
- Kubernetes readiness/liveness probes
- External monitoring

## 6. Logging
`logger` utility emits structured JSON lines. Aggregate with:
- Docker logging driver to Loki
- Fluent Bit -> Elasticsearch
- Cloud provider log ingestion

Sample entry:
```json
{"level":"info","msg":"Export completed","context":{"type":"services","rows":120},"timestamp":"2025-11-21T12:00:00.000Z"}
```

## 7. CI/CD
GitHub Actions workflow (`.github/workflows/ci.yml`):
- Installs dependencies
- Generates Prisma client
- Lints and builds
- Uploads build artifact
- Builds & pushes container image to GHCR on `main`

Security Scans Added:
- `npm audit --audit-level=high` fails build on high severity issues.
- Trivy filesystem scan (app dependencies + OS packages).
- Trivy image scan before push; blocks publishing on HIGH/CRITICAL vulnerabilities.

Add deployment job (e.g. to Kubernetes or Render) after image push.

## 8. Scaling Considerations
| Concern | Strategy |
|---------|----------|
| DB connection count | Use pooled connections (PgBouncer) if concurrency grows |
| Large exports | Background jobs + streaming (implemented) |
| Cache | Introduce Redis for session, rate limits, and computed dashboards |
| Static assets | CDN in front of `/public` and Next.js image optimization |

## 9. Backups & Recovery
 Nightly GitHub Action creates an encrypted compressed dump and (optionally) uploads to S3 or Azure Blob depending on `BACKUP_PROVIDER`.

 Artifacts produced:
 - Raw compressed dump: `backup-YYYYmmdd-HHMMSS.dump.gz` (if no encryption key)
 - Encrypted dump: `backup-YYYYmmdd-HHMMSS.dump.gz.enc`
 - SHA-256 checksum: `backup-YYYYmmdd-HHMMSS.dump.gz.enc.sha256`

 ### 9.1 Required Secrets
 | Purpose | Secret | Notes |
 |---------|--------|-------|
 | Encryption key | `BACKUP_ENCRYPTION_KEY` | Strong passphrase (>= 32 chars) used by OpenSSL AES-256-CBC |
 | Provider selector | `BACKUP_PROVIDER` | `s3` or `azure`; blank = artifact only |
 | AWS creds | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `S3_BUCKET` | Minimal IAM policy: `s3:PutObject`, `s3:GetObject`, `s3:ListBucket` |
 | Azure creds | `AZURE_STORAGE_ACCOUNT` / `AZURE_STORAGE_KEY` / `AZURE_CONTAINER` | Container must exist; action uploads blobs under `db-backups/` |

 ### 9.2 Verification & Restore (Linux/macOS)
 ```bash
 # 1. Download files (artifact, S3, or Azure Blob)
 aws s3 cp s3://$S3_BUCKET/db-backups/backup-20251121-020001.dump.gz.enc .
 aws s3 cp s3://$S3_BUCKET/db-backups/backup-20251121-020001.dump.gz.enc.sha256 .

 # 2. Verify integrity
 shasum -a 256 -c backup-20251121-020001.dump.gz.enc.sha256

 # 3. Decrypt (produces .dump.gz)
 openssl enc -d -aes-256-cbc -pbkdf2 -in backup-20251121-020001.dump.gz.enc \
	 -out backup-20251121-020001.dump.gz -pass pass:"$BACKUP_ENCRYPTION_KEY"

 # 4. Decompress
 gunzip backup-20251121-020001.dump.gz

 # 5. Restore (custom format -> pg_restore)
 export PGPASSWORD="your_db_password"
 pg_restore -h localhost -U postgres -d dkee_restore -c backup-20251121-020001.dump
 ```

 ### 9.3 Verification & Restore (PowerShell / Windows)
 ```powershell
 # 1. Download from S3
 aws s3 cp "s3://$env:S3_BUCKET/db-backups/backup-20251121-020001.dump.gz.enc" .
 aws s3 cp "s3://$env:S3_BUCKET/db-backups/backup-20251121-020001.dump.gz.enc.sha256" .

 # 2. Verify SHA256
 Get-FileHash backup-20251121-020001.dump.gz.enc -Algorithm SHA256 | Select-Object -ExpandProperty Hash > local.hash
 if ((Get-Content local.hash).ToLower() -ne (Get-Content backup-20251121-020001.dump.gz.enc.sha256).Split(' ')[0].ToLower()) { throw 'Checksum mismatch' }

 # 3. Decrypt
 openssl enc -d -aes-256-cbc -pbkdf2 -in backup-20251121-020001.dump.gz.enc -out backup-20251121-020001.dump.gz -pass pass:$env:BACKUP_ENCRYPTION_KEY

 # 4. Decompress
 gzip -d backup-20251121-020001.dump.gz

 # 5. Restore
 $env:PGPASSWORD = 'your_db_password'
 pg_restore -h localhost -U postgres -d dkee_restore -c backup-20251121-020001.dump
 ```

 ### 9.4 Disaster Recovery Checklist
 1. Fetch latest encrypted backup + checksum.
 2. Verify checksum BEFORE decrypting (tamper detection).
 3. Decrypt with `BACKUP_ENCRYPTION_KEY` (store in secure manager; never commit).
 4. Restore into isolated database (`dkee_restore`) and smoke test.
 5. Promote restored DB (swap connection string / redirect app) only after validation.
 6. Record incident & rotate encryption key if compromise suspected.

 ### 9.5 Key Rotation Procedure
 1. Create new secret `BACKUP_ENCRYPTION_KEY_NEW`.
 2. Update workflow to temporarily encrypt with both (or simply switch and keep old backups until retention expires).
 3. After retention window passes, remove old key and re-encrypt any long-term archives if mandated.

 ### 9.6 Restore Helper Scripts
 Provided in `scripts/restore_db.sh` and `scripts/Restore-Db.ps1` for operator convenience.

 ### 9.7 Test Frequency
 - Monthly automated integrity verification (download + checksum).
 - Quarterly full restore rehearsal.
 - After major schema changes, perform an ad-hoc restore validation.

 Legacy (unencrypted) backup section superseded by this process.

### 9.8 Backup Integrity Workflow
Workflow file: `.github/workflows/backup-integrity.yml` (weekly Monday 04:00 UTC)
Steps:
1. List latest object in `db-backups/` prefix (S3 or Azure).
2. Download backup + optional `.sha256`.
3. Verify checksum (`sha256sum -c`).
4. If encrypted (`*.enc`), decrypt with `BACKUP_ENCRYPTION_KEY` and gunzip to ensure integrity.
5. Emits success marker; failures raise alerts via Actions status.

Recommended Alerting:
- Enable GitHub Actions notifications or integrate with Slack webhook on failure.
- Treat repeated failures as potential corruption; trigger immediate DR drill.

## 14. Metrics Endpoint
`GET /api/metrics` exposes Prometheus format:
- `dkee_exports_total` (counter)
- `dkee_export_jobs_pending` (gauge)
- `dkee_rate_limit_allowed_total` (counter)
- `dkee_rate_limit_blocked_total` (counter)
- `dkee_process_start_time` (gauge)

Add scrape config (Prometheus example):
```yaml
scrape_configs:
	- job_name: dkee
		metrics_path: /api/metrics
		scheme: https
		static_configs:
			- targets: ['your-domain.example']
```

## 10. Security Hardening
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options implemented
- ✅ **Rate Limiting**: Active on authentication, payments, uploads, and sales endpoints
- ✅ **Input Sanitization**: All user inputs sanitized to prevent XSS and injection attacks
- Rotate `NEXTAUTH_SECRET` annually (invalidate sessions on rotation plan).
- Isolate secrets using a vault (e.g., AWS Secrets Manager or HashiCorp Vault).
- Enforce HTTPS everywhere (reverse proxy or platform setting).
- Enable Webhook signature verification (TODO for external integrations).
- Periodic dependency audits (`npm audit`, Snyk).

## 11. Observability Enhancements (Future)
- Metrics endpoint (Prometheus) exporting counts of exports, active sessions.
- Distributed tracing (OTel) around key API calls.
- Error tracking (Sentry) integrated into Next.js pages & API routes.

## 11.1 PWA Features (Implemented)
- ✅ **Progressive Web App**: Installable on mobile and desktop devices
- ✅ **Offline Support**: Service worker caches critical resources
- ✅ **Push Notifications**: Real-time notifications to users (requires VAPID keys)
- ✅ **Background Sync**: Queue operations when offline, sync when online
- Web app manifest configured for home screen installation
- Custom service worker for advanced caching strategies

## 12. Deployment Targets
Common options:
- **Docker + VPS**: Compose or systemd units.
- **Kubernetes**: Use image from GHCR, add manifests (Deployment, Service, Ingress, Secrets, ConfigMaps).
- **Vercel**: Adjust environment variables in dashboard; omit Dockerfile (native build).
- **Render/Fly.io**: Direct Docker deployment + volume for Postgres or managed Postgres service.

## 13. Recommended Next Steps
1. Add automated daily DB backup workflow.
2. Introduce staging environment with seed anonymized data.
3. Add Sentry for error monitoring.
4. Implement metrics exporter.
5. Integrate vulnerability scans (Trivy) in CI.

---
For questions or improvements, update this guide and keep `.env.example` synchronized with new variables.
