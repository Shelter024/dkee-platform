<#
.SYNOPSIS
    Restore an encrypted & compressed PostgreSQL custom format backup.
.DESCRIPTION
    Given an encrypted .dump.gz.enc (or plain .dump.gz) file plus optional .sha256 checksum,
    this script verifies integrity, decrypts (AES-256-CBC), decompresses, and runs pg_restore.
.PARAMETER BackupFile
    Path to encrypted (.enc) or compressed (.gz) backup file.
.PARAMETER EncryptionKey
    Passphrase used to encrypt backup (omit if file not encrypted).
.PARAMETER Host
    PostgreSQL host.
.PARAMETER Port
    PostgreSQL port.
.PARAMETER User
    PostgreSQL user.
.PARAMETER Database
    Target database name to restore into (must exist).
.PARAMETER Password
    PostgreSQL user password (optional; can be provided via env PGPASSWORD).
.EXAMPLE
    .\Restore-Db.ps1 -BackupFile backup-20251121-020001.dump.gz.enc -EncryptionKey $env:BACKUP_ENCRYPTION_KEY -Host localhost -Port 5432 -User postgres -Database dkee_restore -Password "secret"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$BackupFile,
    [string]$EncryptionKey,
    [Parameter(Mandatory=$true)][string]$Host,
    [Parameter(Mandatory=$true)][int]$Port,
    [Parameter(Mandatory=$true)][string]$User,
    [Parameter(Mandatory=$true)][string]$Database,
    [string]$Password
)

function Fail($msg) { Write-Error $msg; exit 1 }

if (!(Test-Path $BackupFile)) { Fail "Backup file not found: $BackupFile" }
$checksumFile = "$BackupFile.sha256"
if (Test-Path $checksumFile) {
    Write-Host "Verifying checksum..."
    $expected = (Get-Content $checksumFile).Split(' ')[0].ToLower()
    $actual = (Get-FileHash $BackupFile -Algorithm SHA256).Hash.ToLower()
    if ($expected -ne $actual) { Fail "Checksum mismatch" }
    Write-Host "Checksum OK"
} else {
    Write-Warning "Checksum file missing; skipping integrity verification"
}

$decryptedGz = $BackupFile
if ($BackupFile.EndsWith('.enc')) {
    if (-not $EncryptionKey) { Fail "EncryptionKey required for encrypted file" }
    $decryptedGz = $BackupFile.Substring(0, $BackupFile.Length - 4) # strip .enc
    Write-Host "Decrypting $BackupFile -> $decryptedGz"
    $cmd = "openssl enc -d -aes-256-cbc -pbkdf2 -in `"$BackupFile`" -out `"$decryptedGz`" -pass pass:$EncryptionKey"
    $result = powershell -Command $cmd
}

$rawDump = $decryptedGz
if ($decryptedGz.EndsWith('.gz')) {
    $rawDump = $decryptedGz.Substring(0, $decryptedGz.Length - 3)
    Write-Host "Decompressing $decryptedGz -> $rawDump"
    gzip -d $decryptedGz
}

if (!(Test-Path $rawDump)) { Fail "Restorable dump not found: $rawDump" }

if ($Password) { $env:PGPASSWORD = $Password }
Write-Host "Restoring into $Database on $Host:$Port"
$restoreCmd = "pg_restore -h $Host -p $Port -U $User -d $Database -c `"$rawDump`""
$restore = powershell -Command $restoreCmd
Write-Host "Restore complete."