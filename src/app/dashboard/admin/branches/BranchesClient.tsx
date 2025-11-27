'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Clock,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  manager: string;
  isActive: boolean;
  openingHours: string;
  staffCount: number;
  createdAt: string;
}

export default function BranchesClient() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/branches');
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      // Show sample data for now
      setBranches([
        {
          id: '1',
          name: 'Head Office',
          code: 'HO-001',
          address: 'East Legon',
          city: 'Accra',
          state: 'Greater Accra',
          postalCode: '00233',
          country: 'Ghana',
          phone: '+233 24 101 8947',
          email: 'headoffice@dkee.com',
          manager: 'Shelter Gabada',
          isActive: true,
          openingHours: 'Mon-Fri: 8:00 AM - 6:00 PM',
          staffCount: 12,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.manager.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    // TODO: Open edit modal
    console.log('Edit branch:', id);
  };

  const handleDelete = (id: string) => {
    // TODO: Show confirmation dialog
    console.log('Delete branch:', id);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-600 mt-1">Manage all branch locations and details</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Branch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Branches</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{branches.length}</p>
            </div>
            <div className="w-12 h-12 bg-brand-navy-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-brand-navy-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Branches</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {branches.filter((b) => b.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {branches.reduce((sum, b) => sum + b.staffCount, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name, code, city, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </Card>

      {/* Branches Grid */}
      {filteredBranches.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Try adjusting your search query' : 'Get started by adding your first branch'}
            </p>
            {!searchQuery && (
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Add Branch
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <Card key={branch.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                    <Badge variant={branch.isActive ? 'success' : 'danger'}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{branch.code}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-700">
                    <p>{branch.address}</p>
                    <p>
                      {branch.city}, {branch.state} {branch.postalCode}
                    </p>
                    <p>{branch.country}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{branch.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 truncate">{branch.email}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">Manager: {branch.manager}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{branch.openingHours}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 py-3 border-t border-gray-200 mb-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">Staff</p>
                  <p className="text-lg font-semibold text-gray-900">{branch.staffCount}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(branch.id)}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(branch.id)}
                  variant="outline"
                  className="flex items-center justify-center gap-2 text-brand-red-600 hover:bg-brand-red-50 border-brand-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
