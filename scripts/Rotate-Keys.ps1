# Generates new secrets for NEXTAUTH_SECRET and BACKUP_ENCRYPTION_KEY
$newNextAuth = [Convert]::ToBase64String((openssl rand -base64 32 | Out-String).Trim())
$newBackupKey = (openssl rand -hex 48 | Out-String).Trim()
Write-Host "NEXTAUTH_SECRET=$newNextAuth"
Write-Host "BACKUP_ENCRYPTION_KEY=$newBackupKey"
Write-Host "Paste these into repository/environment secrets and redeploy."