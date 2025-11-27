/**
 * Permission management utilities
 * Centralizes role-based access control logic
 */

export type Permission =
  // User management
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  // Customer management
  | 'customers:read'
  | 'customers:create'
  | 'customers:update'
  | 'customers:delete'
  // Automotive services
  | 'automotive:read'
  | 'automotive:create'
  | 'automotive:update'
  | 'automotive:delete'
  // Property services
  | 'property:read'
  | 'property:create'
  | 'property:update'
  | 'property:delete'
  // Invoices
  | 'invoices:read'
  | 'invoices:create'
  | 'invoices:update'
  | 'invoices:delete'
  // Messages
  | 'messages:read'
  | 'messages:create'
  | 'messages:update'
  | 'messages:delete'
  // CMS (Blog & Pages)
  | 'cms:read'
  | 'cms:create'
  | 'cms:update'
  | 'cms:delete'
  | 'cms:publish'
  // Analytics
  | 'analytics:read'
  | 'analytics:export'
  // Settings
  | 'settings:read'
  | 'settings:update'
  // Admin operations
  | 'admin:all';

export type Role = 'CUSTOMER' | 'STAFF_AUTO' | 'STAFF_PROPERTY' | 'MANAGER' | 'CEO' | 'ADMIN';

/**
 * Role permission map
 * Defines what permissions each role has
 */
const rolePermissions: Record<Role, Permission[]> = {
  CUSTOMER: [
    'automotive:read',
    'property:read',
    'invoices:read',
    'messages:read',
    'messages:create',
  ],
  
  STAFF_AUTO: [
    'customers:read',
    'automotive:read',
    'automotive:create',
    'automotive:update',
    'invoices:read',
    'invoices:create',
    'invoices:update',
    'messages:read',
    'messages:create',
  ],
  
  STAFF_PROPERTY: [
    'customers:read',
    'property:read',
    'property:create',
    'property:update',
    'invoices:read',
    'invoices:create',
    'invoices:update',
    'messages:read',
    'messages:create',
  ],
  
  MANAGER: [
    'users:read',
    'customers:read',
    'customers:create',
    'customers:update',
    'automotive:read',
    'automotive:create',
    'automotive:update',
    'automotive:delete',
    'property:read',
    'property:create',
    'property:update',
    'property:delete',
    'invoices:read',
    'invoices:create',
    'invoices:update',
    'invoices:delete',
    'messages:read',
    'messages:create',
    'messages:update',
    'messages:delete',
    'cms:read',
    'cms:create',
    'cms:update',
    'analytics:read',
    'settings:read',
  ],
  
  CEO: [
    'users:read',
    'users:create',
    'users:update',
    'customers:read',
    'customers:create',
    'customers:update',
    'customers:delete',
    'automotive:read',
    'automotive:create',
    'automotive:update',
    'automotive:delete',
    'property:read',
    'property:create',
    'property:update',
    'property:delete',
    'invoices:read',
    'invoices:create',
    'invoices:update',
    'invoices:delete',
    'messages:read',
    'messages:create',
    'messages:update',
    'messages:delete',
    'cms:read',
    'cms:create',
    'cms:update',
    'cms:delete',
    'cms:publish',
    'analytics:read',
    'analytics:export',
    'settings:read',
    'settings:update',
  ],
  
  ADMIN: [
    'admin:all', // Grants all permissions
  ],
};

/**
 * Check if a user has a specific permission
 * @param userRole - The role of the user
 * @param permission - The permission to check
 * @returns true if the user has the permission
 */
export function hasPermission(userRole: Role | string, permission: Permission): boolean {
  // Type guard
  if (!rolePermissions[userRole as Role]) {
    return false;
  }
  
  const role = userRole as Role;
  const permissions = rolePermissions[role];
  
  // ADMIN has all permissions
  if (permissions.includes('admin:all')) {
    return true;
  }
  
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 * @param userRole - The role of the user
 * @param permissions - Array of permissions to check
 * @returns true if the user has at least one permission
 */
export function hasAnyPermission(userRole: Role | string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 * @param userRole - The role of the user
 * @param permissions - Array of permissions to check
 * @returns true if the user has all permissions
 */
export function hasAllPermissions(userRole: Role | string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 * @param userRole - The role to get permissions for
 * @returns Array of permissions
 */
export function getPermissions(userRole: Role | string): Permission[] {
  if (!rolePermissions[userRole as Role]) {
    return [];
  }
  
  const role = userRole as Role;
  const permissions = rolePermissions[role];
  
  // If admin, return all possible permissions
  if (permissions.includes('admin:all')) {
    return Object.values(rolePermissions)
      .flat()
      .filter((p, i, arr) => arr.indexOf(p) === i); // Deduplicate
  }
  
  return permissions;
}

/**
 * Check if a role is staff (not customer)
 * @param userRole - The role to check
 * @returns true if the role is staff
 */
export function isStaff(userRole: Role | string): boolean {
  return ['ADMIN', 'CEO', 'MANAGER', 'STAFF_AUTO', 'STAFF_PROPERTY'].includes(userRole);
}

/**
 * Check if a role is admin-level (CEO or ADMIN)
 * @param userRole - The role to check
 * @returns true if the role is admin-level
 */
export function isAdmin(userRole: Role | string): boolean {
  return ['ADMIN', 'CEO'].includes(userRole);
}
