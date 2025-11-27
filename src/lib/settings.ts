/**
 * System settings management
 * Handles reading/writing encrypted settings from database
 */

import { prisma } from './prisma';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive setting value
 */
function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('SETTINGS_ENCRYPTION_KEY not configured');
  }

  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'base64');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive setting value
 */
function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('SETTINGS_ENCRYPTION_KEY not configured');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Get a system setting value
 */
export async function getSetting(key: string, defaultValue?: string): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return defaultValue || null;
    }

    return setting.value;
  } catch (error) {
    console.error(`[SETTINGS] Failed to get setting: ${key}`, error);
    return defaultValue || null;
  }
}

/**
 * Set a system setting value
 */
export async function setSetting(
  key: string,
  value: string,
  options?: {
    category?: string;
    isSecret?: boolean;
    updatedBy?: string;
  }
): Promise<void> {
  const finalValue = options?.isSecret ? encrypt(value) : value;

  await prisma.setting.upsert({
    where: { key },
    create: {
      key,
      value,
    },
    update: {
      value,
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete a system setting
 */
export async function deleteSetting(key: string): Promise<void> {
  await prisma.setting.delete({
    where: { key },
  });
}

/**
 * Get all settings in a category
 */
export async function getSettingsByCategory(category: string): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();

  const result: Record<string, string> = {};

  for (const setting of settings) {
    result[setting.key] = setting.value;
  }

  return result;
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  const defaults = [
    { key: 'ai_provider', value: 'mock', isSecret: false },
    { key: 'ai_model', value: '', isSecret: false },
    { key: 'openai_api_key', value: '', isSecret: true },
    { key: 'anthropic_api_key', value: '', isSecret: true },
  ];

  for (const setting of defaults) {
    const existing = await prisma.setting.findUnique({
      where: { key: setting.key },
    });

    if (!existing) {
      await prisma.setting.create({
        data: setting,
      });
    }
  }
}
