'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Users, Search, Mail, Phone, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  userId: string;
  address: string | null;
  company: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    accountStatus: string;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-96 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-indigo-500">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
              <Users className="w-10 h-10" />
              Customers
            </h1>
            <p className="text-gray-600 text-lg">View and manage all customer accounts</p>
          </div>
        </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardBody className="text-center py-12">
                <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">No customers found</p>
              </CardBody>
            </Card>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-navy-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-brand-navy-600" />
                  </div>
                  <Badge 
                    variant={
                      customer.user.accountStatus === 'APPROVED' ? 'success' :
                      customer.user.accountStatus === 'PENDING_APPROVAL' ? 'warning' :
                      customer.user.accountStatus === 'SUSPENDED' ? 'danger' : 'secondary'
                    }
                  >
                    {customer.user.accountStatus}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-lg text-brand-navy-900 mb-2">
                  {customer.user.name}
                </h3>
                
                {customer.company && (
                  <p className="text-sm text-neutral-600 mb-3">{customer.company}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{customer.user.email}</span>
                  </div>
                  {customer.user.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Phone className="w-4 h-4" />
                      <span>{customer.user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Link href={`/dashboard/admin/customers/${customer.id}`}>
                  <Button variant="secondary" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))
        )}
      </div>
      </div>
    </div>
  );
}
