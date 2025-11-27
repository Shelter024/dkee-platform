'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Plus, Edit2, Trash2, X, Shield } from 'lucide-react';
import { ExportButtons } from '@/components/admin/ExportButtons';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/users${roleFilter ? `?role=${roleFilter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get('name')),
      email: String(fd.get('email')),
      phone: String(fd.get('phone')) || undefined,
      role: String(fd.get('role')),
      password: String(fd.get('password')) || undefined,
    };

    try {
      const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');
      await load();
      setShowForm(false);
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const editing = users.find(u => u.id === editingId);

  const roleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge variant="danger">Admin</Badge>;
      case 'CEO': return <Badge variant="danger">CEO</Badge>;
      case 'MANAGER': return <Badge variant="warning">Manager</Badge>;
      case 'HR': return <Badge variant="info">HR</Badge>;
      case 'STAFF_AUTO': return <Badge variant="info">Auto Staff</Badge>;
      case 'STAFF_PROPERTY': return <Badge variant="info">Property Staff</Badge>;
      case 'CUSTOMER': return <Badge>Customer</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-2xl shadow-xl p-8 border-t-4 border-orange-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">User Management</h2>
            <p className="text-gray-600 text-lg">Manage staff accounts and permissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButtons type="staff" />
            <Button onClick={()=>{setShowForm(true); setEditingId(null);}} className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all">
            <Plus className="w-4 h-4 mr-2"/> Add User
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit User' : 'Add User'}</h3>
              <button onClick={()=>{setShowForm(false); setEditingId(null);}} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5"/>
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="name" label="Full Name" defaultValue={editing?.name || ''} required />
                <Input name="email" label="Email" type="email" defaultValue={editing?.email || ''} required />
                <Input name="phone" label="Phone" defaultValue={editing?.phone || ''} />
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" defaultValue={editing?.role || 'CUSTOMER'} className="w-full px-3 py-2 border rounded-lg" required>
                    <option value="CUSTOMER">Customer</option>
                    <option value="STAFF_AUTO">Auto Staff</option>
                    <option value="STAFF_PROPERTY">Property Staff</option>
                    <option value="HR">HR</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CEO">CEO</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <Input name="password" label={editingId ? 'New Password (leave blank to keep)' : 'Password (leave blank for random)'} type="password" />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'} User</Button>
                <Button type="button" variant="outline" onClick={()=>{setShowForm(false); setEditingId(null);}}>Cancel</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Users</h3>
            <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="CEO">CEO</option>
              <option value="MANAGER">Manager</option>
              <option value="HR">HR</option>
              <option value="STAFF_AUTO">Auto Staff</option>
              <option value="STAFF_PROPERTY">Property Staff</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && users.length === 0 && <p className="text-gray-600">No users found.</p>}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-brand-navy-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-brand-navy-600" />
                        </div>
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-sm text-gray-600">Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{u.email}</td>
                    <td className="px-6 py-4 text-sm">{u.phone || '-'}</td>
                    <td className="px-6 py-4">{roleBadge(u.role)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={()=>{setEditingId(u.id); setShowForm(true);}} className="p-2 hover:bg-gray-100 rounded">
                          <Edit2 className="w-4 h-4 text-gray-600"/>
                        </button>
                        <button onClick={()=>deleteUser(u.id)} className="p-2 hover:bg-gray-100 rounded">
                          <Trash2 className="w-4 h-4 text-red-600"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
