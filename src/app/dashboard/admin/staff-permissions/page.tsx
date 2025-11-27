'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Shield,
  Users,
  Save,
  CheckCircle,
  XCircle,
  Settings,
} from 'lucide-react';

export default function StaffPermissionsPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffResponse, permissionsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/staff/permissions'),
      ]);

      const staffData = await staffResponse.json();
      const permissionsData = await permissionsResponse.json();

      // Filter for staff members only
      const staffMembers = (staffData.users || []).filter((user: any) =>
        [
          'STAFF_AUTO',
          'STAFF_PROPERTY',
          'STAFF_SOCIAL_MEDIA',
          'MANAGER',
          'HR',
          'CEO',
          'CONTENT_EDITOR',
        ].includes(user.role)
      );

      setStaff(staffMembers);
      setPermissions(permissionsData.permissions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const getUserPermissions = (userId: string) => {
    return permissions.find((p) => p.userId === userId) || null;
  };

  const handlePermissionChange = async (userId: string, permission: string, value: boolean) => {
    try {
      setSaving(userId);
      const existingPermissions = getUserPermissions(userId) || {};

      const payload = {
        userId,
        canManageUsers: existingPermissions.canManageUsers || false,
        canManageBlog: existingPermissions.canManageBlog || false,
        canManagePages: existingPermissions.canManagePages || false,
        canManageSocial: existingPermissions.canManageSocial || false,
        canViewAnalytics: existingPermissions.canViewAnalytics || false,
        canManageProperty: existingPermissions.canManageProperty || false,
        canManageAutomotive: existingPermissions.canManageAutomotive || false,
        canManageFinance: existingPermissions.canManageFinance || false,
        canApproveRequests: existingPermissions.canApproveRequests || false,
        [permission]: value,
      };

      const response = await fetch('/api/staff/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update permissions');
      }

      setMessage({ type: 'success', text: 'Permissions updated successfully' });
      fetchData();
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: any = {
      ADMIN: 'danger',
      CEO: 'success',
      MANAGER: 'info',
      HR: 'warning',
      STAFF_AUTO: 'default',
      STAFF_PROPERTY: 'default',
      STAFF_SOCIAL_MEDIA: 'default',
      CONTENT_EDITOR: 'default',
    };
    return <Badge variant={colors[role] || 'default'}>{role.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Permissions</h2>
          <p className="text-gray-600 mt-1">Manage staff member access and permissions</p>
        </div>
        <Shield className="w-8 h-8 text-brand-red-600" />
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Staff List */}
      {loading ? (
        <Card>
          <CardBody>
            <p className="text-gray-600">Loading staff members...</p>
          </CardBody>
        </Card>
      ) : staff.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Members</h3>
            <p className="text-gray-600">No staff members found to manage permissions.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {staff.map((member) => {
            const userPerms = getUserPermissions(member.id);
            const isSaving = saving === member.id;

            return (
              <Card key={member.id} className="hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-brand-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    {getRoleBadge(member.role)}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* User Management */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPerms?.canManageUsers || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canManageUsers', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">Manage Users</p>
                        <p className="text-xs text-gray-500">Create, edit, delete users</p>
                      </div>
                    </label>

                    {/* Blog Management */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPerms?.canManageBlog || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canManageBlog', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">Manage Blog</p>
                        <p className="text-xs text-gray-500">Create and edit blog posts</p>
                      </div>
                    </label>

                    {/* Page Management */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPerms?.canManagePages || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canManagePages', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">Manage Pages</p>
                        <p className="text-xs text-gray-500">Edit website pages</p>
                      </div>
                    </label>

                    {/* Social Media */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer bg-blue-50 border border-blue-200">
                      <input
                        type="checkbox"
                        checked={userPerms?.canManageSocial || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canManageSocial', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">Social Media</p>
                        <p className="text-xs text-gray-500">Manage social posts</p>
                      </div>
                    </label>

                    {/* Analytics */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPerms?.canViewAnalytics || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canViewAnalytics', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">View Analytics</p>
                        <p className="text-xs text-gray-500">Access reports and analytics</p>
                      </div>
                    </label>

                    {/* Property Management */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer bg-green-50 border border-green-200">
                      <input
                        type="checkbox"
                        checked={userPerms?.canManageProperty || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canManageProperty', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">Property Requests</p>
                        <p className="text-xs text-gray-500">Manage property forms</p>
                      </div>
                    </label>

                    {/* Automotive Management */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPerms?.canManageAutomotive || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canManageAutomotive', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">Automotive Services</p>
                        <p className="text-xs text-gray-500">Manage vehicle services</p>
                      </div>
                    </label>

                    {/* Finance Management */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPerms?.canManageFinance || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canManageFinance', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">Financial Records</p>
                        <p className="text-xs text-gray-500">Access invoices and payments</p>
                      </div>
                    </label>

                    {/* Approve Requests */}
                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer bg-yellow-50 border border-yellow-200">
                      <input
                        type="checkbox"
                        checked={userPerms?.canApproveRequests || false}
                        onChange={(e) =>
                          handlePermissionChange(member.id, 'canApproveRequests', e.target.checked)
                        }
                        disabled={isSaving}
                        className="rounded text-brand-red-600 focus:ring-brand-red-500"
                      />
                      <div>
                        <p className="font-medium text-sm">Approve Requests</p>
                        <p className="text-xs text-gray-500">Approve service requests</p>
                      </div>
                    </label>
                  </div>

                  {isSaving && (
                    <div className="mt-4 text-sm text-gray-600 flex items-center space-x-2">
                      <Settings className="w-4 h-4 animate-spin" />
                      <span>Saving permissions...</span>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
