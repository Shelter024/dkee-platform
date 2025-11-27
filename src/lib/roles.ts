export const elevatedRoles = ['ADMIN', 'CEO', 'MANAGER', 'HR', 'ACCOUNTANT', 'AUDITOR', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'ADMIN_MANAGER'] as const;
export type ElevatedRole = typeof elevatedRoles[number];

export function isElevatedRole(role?: string): boolean {
  return !!role && elevatedRoles.includes(role as ElevatedRole);
}

export function canAccessAdmin(role?: string): boolean {
  return isElevatedRole(role) || role === 'ADMIN';
}

// Added for permission checks in API routes
export function isAdmin(userOrRole: { role?: string } | string | undefined): boolean {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  return role === 'ADMIN';
}

export function isStaff(userOrRole: { role?: string } | string | undefined): boolean {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  if (!role) return false;
  return [
    'STAFF_AUTO',
    'STAFF_PROPERTY',
    'STAFF_SOCIAL_MEDIA',
    'ADMIN',
    'MANAGER',
    'CEO',
    'HR',
    'CONTENT_EDITOR',
    'ACCOUNTANT',
    'AUDITOR',
    'FINANCE_MANAGER',
    'OPERATIONS_MANAGER',
    'ADMIN_MANAGER',
  ].includes(role);
}

// Management roles with elevated permissions
export function isManagementRole(role?: string): boolean {
  if (!role) return false;
  return ['CEO', 'ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'ADMIN_MANAGER', 'MANAGER'].includes(role);
}

// Finance roles
export function isFinanceRole(role?: string): boolean {
  if (!role) return false;
  return ['ACCOUNTANT', 'FINANCE_MANAGER', 'CEO', 'ADMIN'].includes(role);
}

// Audit roles
export function isAuditRole(role?: string): boolean {
  if (!role) return false;
  return ['AUDITOR', 'CEO', 'ADMIN'].includes(role);
}

// Page editing permissions: ADMIN, CEO, MANAGER, HR, CONTENT_EDITOR
export function canEditPages(role?: string): boolean {
  return !!role && ['ADMIN','CEO','MANAGER','HR','CONTENT_EDITOR'].includes(role);
}