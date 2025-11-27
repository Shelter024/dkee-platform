'use client';

import { useState, useEffect } from 'react';
import { Search, UserX, UserCheck, AlertTriangle, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  accountStatus: string;
  emailVerified: Date | null;
  phoneVerified: boolean;
  rejectionReason: string | null;
  createdAt: string;
}

export default function ManageAllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionModal, setActionModal] = useState<{
    show: boolean;
    action: 'suspend' | 'delete' | 'warn' | 'unsuspend' | null;
    userId: string | null;
    userName: string | null;
  }>({ show: false, action: null, userId: null, userName: null });
  const [reason, setReason] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      } else {
        alert(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal.userId || !actionModal.action) return;

    if ((actionModal.action === 'suspend' || actionModal.action === 'delete') && !reason.trim()) {
      alert('Please provide a reason');
      return;
    }

    if (actionModal.action === 'warn' && !warningMessage.trim()) {
      alert('Please provide a warning message');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/users/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: actionModal.userId,
          action: actionModal.action,
          reason: reason || undefined,
          warningMessage: warningMessage || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setActionModal({ show: false, action: null, userId: null, userName: null });
        setReason('');
        setWarningMessage('');
        fetchUsers();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (
    action: 'suspend' | 'delete' | 'warn' | 'unsuspend',
    userId: string,
    userName: string
  ) => {
    setActionModal({ show: true, action, userId, userName });
    setReason('');
    setWarningMessage('');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
      PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          styles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800',
      CEO: 'bg-indigo-100 text-indigo-800',
      MANAGER: 'bg-blue-100 text-blue-800',
      HR: 'bg-cyan-100 text-cyan-800',
      STAFF_AUTO: 'bg-green-100 text-green-800',
      STAFF_PROPERTY: 'bg-teal-100 text-teal-800',
      CUSTOMER: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage all users: customers and staff</p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="STAFF_AUTO">Staff - Automotive</option>
          <option value="STAFF_PROPERTY">Staff - Property</option>
          <option value="HR">HR</option>
          <option value="MANAGER">Manager</option>
          <option value="CEO">CEO</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING_VERIFICATION">Pending Verification</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.accountStatus)}
                      {user.rejectionReason && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {user.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {user.accountStatus === 'SUSPENDED' ? (
                          <button
                            onClick={() => openActionModal('unsuspend', user.id, user.name)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Unsuspend"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openActionModal('suspend', user.id, user.name)}
                            className="text-orange-600 hover:text-orange-900 p-1"
                            title="Suspend"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openActionModal('warn', user.id, user.name)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Warn"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openActionModal('delete', user.id, user.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {actionModal.action === 'suspend' && 'Suspend User'}
              {actionModal.action === 'unsuspend' && 'Unsuspend User'}
              {actionModal.action === 'delete' && 'Delete User'}
              {actionModal.action === 'warn' && 'Warn User'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              User: <strong>{actionModal.userName}</strong>
            </p>

            {actionModal.action === 'suspend' && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for suspension..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                rows={4}
              />
            )}

            {actionModal.action === 'delete' && (
              <>
                <p className="text-sm text-red-600 mb-2">
                  ⚠️ This action cannot be undone. All user data will be permanently deleted.
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for deletion..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                  rows={4}
                />
              </>
            )}

            {actionModal.action === 'warn' && (
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Warning message to send to user..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-4"
                rows={4}
              />
            )}

            {actionModal.action === 'unsuspend' && (
              <p className="text-sm text-gray-600 mb-4">
                This will reactivate the user's account and grant full access.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setActionModal({ show: false, action: null, userId: null, userName: null })
                }
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
                  actionModal.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : actionModal.action === 'suspend'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : actionModal.action === 'warn'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
