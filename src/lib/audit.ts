/**
 * Audit logging for sensitive operations
 * Tracks who did what, when, and from where
 */

import { prisma } from './prisma';

export type AuditAction =
  // User management
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.role_change'
  // Customer management
  | 'customer.create'
  | 'customer.update'
  | 'customer.delete'
  // Services
  | 'service.create'
  | 'service.update'
  | 'service.delete'
  | 'service.approve'
  | 'service.reject'
  // Invoices
  | 'invoice.create'
  | 'invoice.update'
  | 'invoice.delete'
  | 'invoice.pay'
  // CMS
  | 'cms.post.create'
  | 'cms.post.update'
  | 'cms.post.delete'
  | 'cms.post.publish'
  | 'cms.post.unpublish'
  | 'cms.page.create'
  | 'cms.page.update'
  | 'cms.page.delete'
  | 'cms.page.publish'
  | 'cms.page.unpublish'
  // Settings
  | 'settings.update'
  // Auth
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.password_reset';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log an audit event to the database
 * Parses audit action to extract model and operation for database storage
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Log to console for debugging
    console.log('[AUDIT]', JSON.stringify(logEntry));

    // Parse action (e.g., "user.create" -> "CREATE", "service.approve" -> "APPROVE")
    const actionParts = entry.action.split('.');
    const targetModel = actionParts[0].toUpperCase(); // user -> USER, service -> SERVICE
    const operation = actionParts[actionParts.length - 1].toUpperCase(); // create -> CREATE

    // Write to database
    await prisma.auditLog.create({
      data: {
        action: operation,
        userId: entry.userId || null,
        targetModel: targetModel,
        targetId: entry.metadata?.targetId || 'N/A',
        changes: entry.metadata || {},
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the application
    console.error('[AUDIT] Failed to log audit event:', error);
  }
}

/**
 * Extract IP address from request headers
 */
export function getIpAddress(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown';
}

/**
 * Create audit log entry from request context
 */
export function createAuditEntry(
  action: AuditAction,
  success: boolean,
  options?: {
    userId?: string;
    userRole?: string;
    headers?: Headers;
    metadata?: Record<string, any>;
    errorMessage?: string;
  }
): AuditLogEntry {
  return {
    action,
    success,
    userId: options?.userId,
    userRole: options?.userRole,
    ipAddress: options?.headers ? getIpAddress(options.headers) : undefined,
    userAgent: options?.headers ? getUserAgent(options.headers) : undefined,
    metadata: options?.metadata,
    errorMessage: options?.errorMessage,
  };
}

/**
 * Convenience function to log successful operation
 */
export async function logSuccess(
  action: AuditAction,
  options?: {
    userId?: string;
    userRole?: string;
    headers?: Headers;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  await logAudit(createAuditEntry(action, true, options));
}

/**
 * Convenience function to log failed operation
 */
export async function logFailure(
  action: AuditAction,
  errorMessage: string,
  options?: {
    userId?: string;
    userRole?: string;
    headers?: Headers;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  await logAudit(
    createAuditEntry(action, false, {
      ...options,
      errorMessage,
    })
  );
}
