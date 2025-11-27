#!/usr/bin/env node

/**
 * Generate secure random secrets for environment variables
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64url');
}

function generateHex(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('='.repeat(60));
console.log('GENERATED SECRETS FOR ENVIRONMENT VARIABLES');
console.log('='.repeat(60));
console.log('');

console.log('# Authentication & Session');
console.log(`NEXTAUTH_SECRET=${generateSecret(32)}`);
console.log('');

console.log('# Encryption Keys');
console.log(`ENCRYPTION_KEY=${generateHex(32)}`);
console.log(`BACKUP_ENCRYPTION_KEY=${generateHex(32)}`);
console.log('');

console.log('# API Keys (generate 2 for rotation)');
console.log(`API_KEY_1=${generateSecret(24)}`);
console.log(`API_KEY_2=${generateSecret(24)}`);
console.log('');

console.log('# WebAuthn');
console.log(`WEBAUTHN_RP_ID=${process.env.NEXT_PUBLIC_BASE_URL?.replace('https://', '') || 'localhost'}`);
console.log(`WEBAUTHN_RP_NAME="DK Executive Engineers"`);
console.log(`WEBAUTHN_ORIGIN=${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`);
console.log('');

console.log('# Redis (if using password authentication)');
console.log(`REDIS_PASSWORD=${generateSecret(24)}`);
console.log('');

console.log('='.repeat(60));
console.log('IMPORTANT: Store these secrets securely!');
console.log('- Add them to your .env.local file');
console.log('- Add them to Vercel environment variables');
console.log('- Never commit these values to version control');
console.log('='.repeat(60));
