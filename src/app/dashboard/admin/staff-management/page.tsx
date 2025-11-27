'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Shield,
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  Settings,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  Building,
  Award,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  staffId?: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  accountStatus: string;
}

interface Permission {
  category: string;
  permissions: {
    key: string;
    label: string;
    description: string;
  }[];
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  const permissionCategories: Permission[] = [
    {
      category: 'System & User Management',
      permissions: [
        { key: 'canManageUsers', label: 'Manage Users', description: 'Create, edit, and delete user accounts' },
        { key: 'canManageStaff', label: 'Manage Staff', description: 'Manage staff accounts and roles' },
        { key: 'canViewUserActivity', label: 'View User Activity', description: 'View user activity logs and history' },
        { key: 'canManagePermissions', label: 'Manage Permissions', description: 'Grant/revoke staff permissions' },
      ],
    },
    {
      category: 'Content Management',
      permissions: [
        { key: 'canManageBlog', label: 'Manage Blog', description: 'Create and edit blog posts' },
        { key: 'canManagePages', label: 'Manage Pages', description: 'Edit website pages and content' },
        { key: 'canManageSocial', label: 'Social Media', description: 'Manage social media posts and campaigns' },
        { key: 'canPublishContent', label: 'Publish Content', description: 'Publish content without approval' },
      ],
    },
    {
      category: 'Property Services',
      permissions: [
        { key: 'canManageProperty', label: 'Manage Property', description: 'Handle property requests and forms' },
        { key: 'canApprovePropertyRequests', label: 'Approve Requests', description: 'Approve property service requests' },
        { key: 'canAssignPropertyTasks', label: 'Assign Tasks', description: 'Assign property tasks to staff' },
        { key: 'canViewPropertyAnalytics', label: 'View Analytics', description: 'View property analytics and reports' },
      ],
    },
    {
      category: 'Automotive Services',
      permissions: [
        { key: 'canManageAutomotive', label: 'Manage Automotive', description: 'Manage automotive service requests' },
        { key: 'canApproveAutomotiveRequests', label: 'Approve Requests', description: 'Approve automotive requests' },
        { key: 'canScheduleServices', label: 'Schedule Services', description: 'Schedule service appointments' },
      ],
    },
    {
      category: 'Financial Management',
      permissions: [
        { key: 'canManageFinance', label: 'Manage Finance', description: 'Access and manage financial records' },
        { key: 'canViewInvoices', label: 'View Invoices', description: 'View all customer invoices' },
        { key: 'canCreateInvoices', label: 'Create Invoices', description: 'Create and issue invoices' },
        { key: 'canProcessPayments', label: 'Process Payments', description: 'Process customer payments' },
        { key: 'canApproveRefunds', label: 'Approve Refunds', description: 'Approve refund requests' },
        { key: 'canViewFinancialReports', label: 'Financial Reports', description: 'View financial reports and statements' },
        { key: 'canExportFinancialData', label: 'Export Data', description: 'Export financial data to files' },
      ],
    },
    {
      category: 'Client Management',
      permissions: [
        { key: 'canViewAllClients', label: 'View All Clients', description: 'Access all client information' },
        { key: 'canEditClientInfo', label: 'Edit Client Info', description: 'Edit client details and records' },
        { key: 'canAssignClients', label: 'Assign Clients', description: 'Assign clients to staff members' },
        { key: 'canViewClientHistory', label: 'View Client History', description: 'View client interaction history' },
      ],
    },
    {
      category: 'Communication',
      permissions: [
        { key: 'canSendMessages', label: 'Send Messages', description: 'Send internal staff messages' },
        { key: 'canSendBroadcasts', label: 'Send Broadcasts', description: 'Send broadcast messages to all staff' },
        { key: 'canAccessEmails', label: 'Access Emails', description: 'Access email communication system' },
        { key: 'canManageNotifications', label: 'Manage Notifications', description: 'Manage system notifications' },
      ],
    },
    {
      category: 'Analytics & Reports',
      permissions: [
        { key: 'canViewAnalytics', label: 'View Analytics', description: 'View analytics dashboard' },
        { key: 'canExportReports', label: 'Export Reports', description: 'Export reports to files' },
        { key: 'canViewAllReports', label: 'View All Reports', description: 'View all department reports' },
        { key: 'canCreateCustomReports', label: 'Custom Reports', description: 'Create custom report templates' },
      ],
    },
    {
      category: 'Emergency & Alerts',
      permissions: [
        { key: 'canViewEmergencies', label: 'View Emergencies', description: 'View emergency requests' },
        { key: 'canRespondToEmergencies', label: 'Respond to Emergencies', description: 'Respond to emergency situations' },
        { key: 'canCreateAlerts', label: 'Create Alerts', description: 'Create system alerts for staff' },
        { key: 'canManageAlerts', label: 'Manage Alerts', description: 'Manage and resolve alerts' },
      ],
    },
    {
      category: 'Job & Task Management',
      permissions: [
        { key: 'canViewAllJobs', label: 'View All Jobs', description: 'View all job assignments' },
        { key: 'canAssignJobs', label: 'Assign Jobs', description: 'Assign jobs to staff members' },
        { key: 'canUpdateJobStatus', label: 'Update Job Status', description: 'Update job status and progress' },
        { key: 'canApproveJobCompletion', label: 'Approve Completion', description: 'Approve job completion' },
      ],
    },
    {
      category: 'Request Management',
      permissions: [
        { key: 'canApproveRequests', label: 'Approve Requests', description: 'Approve general requests' },
        { key: 'canRejectRequests', label: 'Reject Requests', description: 'Reject submitted requests' },
        { key: 'canRequestPermissions', label: 'Request Permissions', description: 'Request additional permissions from admin' },
      ],
    },
    {
      category: 'System Administration',
      permissions: [
        { key: 'canAccessSettings', label: 'Access Settings', description: 'Access system settings' },
        { key: 'canManageIntegrations', label: 'Manage Integrations', description: 'Manage third-party integrations' },
        { key: 'canViewAuditLogs', label: 'View Audit Logs', description: 'View system audit logs' },
        { key: 'canManageBranches', label: 'Manage Branches', description: 'Manage branch information' },
      ],
    },
  ];

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

      const payload: any = {
        userId,
        [permission]: value,
      };

      // Include all existing permissions
      permissionCategories.forEach((category) => {
        category.permissions.forEach((perm) => {
          if (perm.key !== permission) {
            payload[perm.key] = existingPermissions[perm.key] || false;
          }
        });
      });

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

  const getStatusBadge = (status: string) => {
    const colors: any = {
      APPROVED: 'success',
      PENDING_APPROVAL: 'warning',
      SUSPENDED: 'danger',
      PENDING_VERIFICATION: 'info',
    };
    return <Badge variant={colors[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.staffId && member.staffId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment =
      filterDepartment === 'ALL' || member.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  const departments = Array.from(new Set(staff.map((s) => s.department).filter(Boolean)));

  const countActivePermissions = (userId: string) => {
    const userPerms = getUserPermissions(userId);
    if (!userPerms) return 0;
    
    let count = 0;
    permissionCategories.forEach((category) => {
      category.permissions.forEach((perm) => {
        if (userPerms[perm.key]) count++;
      });
    });
    return count;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-indigo-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Staff Management
            </h2>
            <p className="text-gray-600 text-lg">Manage staff members, roles, and detailed permissions</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-indigo-100 to-blue-100 p-4 rounded-2xl">
              <Shield className="w-12 h-12 text-indigo-600" />
            </div>
            <Button 
              onClick={() => setShowAddStaffModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
            >
              <UserPlus className="w-6 h-6" />
              Add Staff Member
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-6 rounded-2xl shadow-lg flex items-center space-x-3 ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-green-800 border-2 border-green-300'
                : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-2 border-red-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              message.type === 'success' ? 'bg-green-200' : 'bg-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
            <span className="font-semibold text-lg flex-1">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-600 hover:text-gray-800 text-3xl font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-white rounded-2xl shadow-xl border-0">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-6 h-6" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or staff ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-all"
                  />
                </div>
              </div>
              <div className="w-full md:w-72">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-semibold transition-all"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {staff.filter((s) => s.accountStatus === 'APPROVED').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <Building className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">With Permissions</p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Staff List */}
      {loading ? (
        <Card>
          <CardBody>
            <p className="text-gray-600">Loading staff members...</p>
          </CardBody>
        </Card>
      ) : filteredStaff.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Members Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterDepartment !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Add your first staff member to get started'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStaff.map((member) => {
            const userPerms = getUserPermissions(member.id);
            const isSaving = saving === member.id;
            const isExpanded = expandedStaff === member.id;
            const activePermsCount = countActivePermissions(member.id);

            return (
              <Card key={member.id} className="hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-brand-red-500 to-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold">{member.name}</h3>
                          {getRoleBadge(member.role)}
                          {getStatusBadge(member.accountStatus)}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          {member.staffId && (
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4" />
                              <span className="font-medium">{member.staffId}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm">
                          {member.department && (
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Building className="w-4 h-4" />
                              <span>{member.department}</span>
                            </div>
                          )}
                          {member.jobTitle && (
                            <div className="text-gray-600">
                              <span className="font-medium">{member.jobTitle}</span>
                            </div>
                          )}
                          {member.hireDate && (
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Since {new Date(member.hireDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Active Permissions</p>
                        <p className="text-2xl font-bold text-brand-red-600">{activePermsCount}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedStaff(isExpanded ? null : member.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Manage
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardBody className="border-t">
                    <div className="space-y-6">
                      {permissionCategories.map((category) => (
                        <div key={category.category}>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-brand-red-600" />
                            <span>{category.category}</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {category.permissions.map((perm) => (
                              <label
                                key={perm.key}
                                className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  userPerms?.[perm.key]
                                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={userPerms?.[perm.key] || false}
                                  onChange={(e) =>
                                    handlePermissionChange(member.id, perm.key, e.target.checked)
                                  }
                                  disabled={isSaving}
                                  className="mt-1 rounded text-brand-red-600 focus:ring-brand-red-500"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900">{perm.label}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {isSaving && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 flex items-center space-x-2">
                        <Settings className="w-4 h-4 animate-spin" />
                        <span>Saving permissions...</span>
                      </div>
                    )}
                  </CardBody>
                )}
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
