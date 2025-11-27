// Input sanitization utilities for API endpoints
// Helps prevent XSS, SQL injection, and other injection attacks

/**
 * Sanitize a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Remove control characters except tab, newline, carriage return
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitize HTML to prevent XSS attacks
 * For rich text, use a proper HTML sanitizer library like DOMPurify
 */
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize email addresses
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  // Basic email validation and sanitization
  const sanitized = sanitizeString(email).toLowerCase();
  
  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitize phone numbers - allow only digits, spaces, +, -, (, )
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  const sanitized = phone.replace(/[^0-9+\-() ]/g, '').trim();
  
  // Basic validation: must have at least 10 digits
  const digitCount = sanitized.replace(/\D/g, '').length;
  if (digitCount < 10) {
    throw new Error('Phone number must contain at least 10 digits');
  }
  
  return sanitized;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any): number {
  const num = parseFloat(input);
  
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid number');
  }
  
  return num;
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: any): number {
  const num = parseInt(input, 10);
  
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid integer');
  }
  
  return num;
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') return input;
  if (input === 'true' || input === '1' || input === 1) return true;
  if (input === 'false' || input === '0' || input === 0) return false;
  
  throw new Error('Invalid boolean value');
}

/**
 * Sanitize URL to prevent XSS and malicious redirects
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return '';
  
  const sanitized = sanitizeString(url);
  
  // Only allow http, https, and relative URLs
  if (sanitized.startsWith('/')) {
    return sanitized;
  }
  
  try {
    const parsed = new URL(sanitized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitize file names to prevent directory traversal
 */
export function sanitizeFileName(fileName: string | null | undefined): string {
  if (!fileName) return '';
  
  // Remove path separators and null bytes
  let sanitized = fileName.replace(/[\/\\:\0]/g, '');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  if (!sanitized) {
    throw new Error('Invalid file name');
  }
  
  return sanitized;
}

/**
 * Sanitize SQL-like inputs (additional layer, always use parameterized queries)
 */
export function sanitizeSQL(input: string | null | undefined): string {
  if (!input) return '';
  
  // Remove SQL comment markers and dangerous keywords
  let sanitized = sanitizeString(input);
  
  // Remove common SQL injection patterns
  sanitized = sanitized.replace(/--|;|\/\*|\*\/|xp_|sp_|exec|execute|union|select|insert|update|delete|drop|create|alter/gi, '');
  
  return sanitized;
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePagination(page?: any, limit?: any): { page: number; limit: number } {
  const maxLimit = 100;
  const defaultLimit = 20;
  
  let sanitizedPage = 1;
  let sanitizedLimit = defaultLimit;
  
  if (page !== undefined && page !== null) {
    sanitizedPage = Math.max(1, sanitizeInteger(page));
  }
  
  if (limit !== undefined && limit !== null) {
    sanitizedLimit = Math.min(maxLimit, Math.max(1, sanitizeInteger(limit)));
  }
  
  return { page: sanitizedPage, limit: sanitizedLimit };
}

/**
 * Sanitize object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}
