'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare, User, Phone, Mail } from 'lucide-react';
import { ExportButtons } from '@/components/admin/ExportButtons';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const url = `/api/inquiries${filter ? `?status=${filter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setInquiries(data.inquiries || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'NEW': return <Badge variant="warning">New</Badge>;
      case 'CONTACTED': return <Badge variant="info">Contacted</Badge>;
      case 'SCHEDULED': return <Badge variant="success">Scheduled</Badge>;
      case 'CLOSED': return <Badge>Closed</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Inquiries</h2>
          <p className="text-gray-600 mt-1">Manage customer property inquiries</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons type="inquiries" />
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">All Inquiries</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <Card>
        <CardBody>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && inquiries.length === 0 && <p className="text-gray-600">No inquiries found.</p>}
          
          <div className="space-y-4">
            {inquiries.map(inq => (
              <div key={inq.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-brand-navy-600" />
                      <h3 className="font-semibold">{inq.property?.title}</h3>
                      {statusBadge(inq.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="w-4 h-4"/>
                        <span>{inq.customer?.user?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="w-4 h-4"/>
                        <span>{inq.customer?.user?.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="w-4 h-4"/>
                        <span>{inq.customer?.user?.email}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded mt-2">
                        <p className="text-gray-700">{inq.message}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        Received: {new Date(inq.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  {inq.status === 'NEW' && (
                    <button onClick={()=>updateStatus(inq.id, 'CONTACTED')} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Mark Contacted
                    </button>
                  )}
                  {inq.status === 'CONTACTED' && (
                    <button onClick={()=>updateStatus(inq.id, 'SCHEDULED')} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                      Mark Scheduled
                    </button>
                  )}
                  {(inq.status === 'NEW' || inq.status === 'CONTACTED' || inq.status === 'SCHEDULED') && (
                    <button onClick={()=>updateStatus(inq.id, 'CLOSED')} className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                      Close
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
