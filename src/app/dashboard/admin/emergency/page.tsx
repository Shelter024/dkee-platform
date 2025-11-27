'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, MapPin, Phone, Clock, User } from 'lucide-react';
import { ExportButtons } from '@/components/admin/ExportButtons';

export default function AdminEmergencyPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const url = `/api/emergency${filter ? `?status=${filter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setRequests(data.requests || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/emergency/${id}`, {
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
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'ASSIGNED': return <Badge variant="info">Assigned</Badge>;
      case 'IN_PROGRESS': return <Badge variant="info">In Progress</Badge>;
      case 'RESOLVED': return <Badge variant="success">Resolved</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-2xl shadow-xl p-8 border-t-4 border-red-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">Emergency Requests</h2>
            <p className="text-gray-600 text-lg">Manage urgent assistance requests</p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButtons type="emergencies" />
            <select value={filter} onChange={e=>setFilter(e.target.value)} className="px-4 py-3 border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium">
            <option value="">All Requests</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <Card>
        <CardBody>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && requests.length === 0 && <p className="text-gray-600">No emergency requests found.</p>}
          
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="p-4 border rounded-lg border-red-200 bg-red-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">Emergency Request</h3>
                  </div>
                  {statusBadge(req.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="w-4 h-4"/>
                    <span>{req.customer?.user?.name} - {req.customer?.user?.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <MapPin className="w-4 h-4"/>
                    <span>{req.location}</span>
                  </div>
                  <div className="p-3 bg-white rounded">
                    <p className="text-gray-700">{req.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Clock className="w-4 h-4"/>
                    <span>Requested: {new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  {req.status === 'PENDING' && (
                    <button onClick={()=>updateStatus(req.id, 'ASSIGNED')} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Assign Technician
                    </button>
                  )}
                  {req.status === 'ASSIGNED' && (
                    <button onClick={()=>updateStatus(req.id, 'IN_PROGRESS')} className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
                      Start Response
                    </button>
                  )}
                  {req.status === 'IN_PROGRESS' && (
                    <button onClick={()=>updateStatus(req.id, 'RESOLVED')} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
