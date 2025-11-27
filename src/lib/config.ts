import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'default-32-char-key-change-this!';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive setting values before storing in database
 */
export function encryptSetting(value: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt setting');
  }
}

/**
 * Decrypt sensitive setting values from database
 */
export function decryptSetting(encryptedValue: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const parts = encryptedValue.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt setting');
  }
}

/**
 * List of settings that should be encrypted
 */
const SENSITIVE_KEYS = [
  'DATABASE_URL',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_API_KEY',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_ACCOUNT_SID',
  'PUSHER_SECRET',
  'NEXTAUTH_SECRET',
  'SMTP_PASSWORD',
];

export function isSensitiveSetting(key: string): boolean {
  return SENSITIVE_KEYS.some(k => key.includes(k));
}

/**
 * Get configuration value with fallback to environment variable
 */
export async function getConfig(key: string, prisma: any): Promise<string | null> {
  // First check database
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    
    if (setting) {
      // Decrypt if sensitive
      if (isSensitiveSetting(key)) {
        return decryptSetting(setting.value);
      }
      return setting.value;
    }
  } catch (error) {
    console.warn(`Failed to fetch setting ${key} from database:`, error);
  }
  
  // Fallback to environment variable
  return process.env[key] || null;
}

/**
 * Set configuration value in database
 */
export async function setConfig(
  key: string,
  value: string,
  prisma: any
): Promise<void> {
  const valueToStore = isSensitiveSetting(key) ? encryptSetting(value) : value;
  
  await prisma.setting.upsert({
    where: { key },
    update: { value: valueToStore },
    create: { key, value: valueToStore },
  });
}

/**
 * Configuration categories for UI organization
 */
export const CONFIG_CATEGORIES = {
  DATABASE: {
    label: 'Database',
    icon: 'Database',
    settings: [
      { key: 'DATABASE_URL', label: 'Database Connection URL', type: 'password', required: true },
    ],
  },
  CLOUDINARY: {
    label: 'File Storage (Cloudinary)',
    icon: 'Cloud',
    settings: [
      { key: 'CLOUDINARY_CLOUD_NAME', label: 'Cloud Name', type: 'text', required: true },
      { key: 'CLOUDINARY_API_KEY', label: 'API Key', type: 'password', required: true },
      { key: 'CLOUDINARY_API_SECRET', label: 'API Secret', type: 'password', required: true },
    ],
  },
  TWILIO: {
    label: 'SMS/OTP (Twilio)',
    icon: 'MessageSquare',
    settings: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', type: 'password', required: false },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', type: 'password', required: false },
      { key: 'TWILIO_PHONE_NUMBER', label: 'Phone Number', type: 'text', required: false },
    ],
  },
  PUSHER: {
    label: 'Real-time Messaging (Pusher)',
    icon: 'Zap',
    settings: [
      { key: 'NEXT_PUBLIC_PUSHER_APP_KEY', label: 'App Key (Public)', type: 'text', required: false },
      { key: 'PUSHER_APP_ID', label: 'App ID', type: 'text', required: false },
      { key: 'PUSHER_SECRET', label: 'Secret', type: 'password', required: false },
      { key: 'PUSHER_CLUSTER', label: 'Cluster', type: 'text', required: false },
    ],
  },
  EMAIL: {
    label: 'Email (SMTP)',
    icon: 'Mail',
    settings: [
      { key: 'SMTP_HOST', label: 'SMTP Host', type: 'text', required: false },
      { key: 'SMTP_PORT', label: 'SMTP Port', type: 'text', required: false },
      { key: 'SMTP_USER', label: 'SMTP User', type: 'text', required: false },
      { key: 'SMTP_PASSWORD', label: 'SMTP Password', type: 'password', required: false },
      { key: 'SMTP_FROM_EMAIL', label: 'From Email', type: 'email', required: false },
      { key: 'SMTP_FROM_NAME', label: 'From Name', type: 'text', required: false },
    ],
  },
  AUTH: {
    label: 'Authentication',
    icon: 'Lock',
    settings: [
      { key: 'NEXTAUTH_SECRET', label: 'NextAuth Secret', type: 'password', required: true },
      { key: 'NEXTAUTH_URL', label: 'NextAuth URL', type: 'url', required: true },
    ],
  },
};
