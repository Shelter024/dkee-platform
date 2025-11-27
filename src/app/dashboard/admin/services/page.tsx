'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Wrench, FileDown, CheckCircle, Clock } from 'lucide-react';

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genId, setGenId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services?approvalStatus=APPROVED');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load services');
      setServices(data.services || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{s}</Badge>;
    }
  };

  const generateJobCard = async (id: string) => {
    try {
      setGenId(id);
      const res = await fetch(`/api/services/${id}/job-card`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-indigo-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Services</h2>
            <p className="text-gray-600 text-lg mt-2">Manage approved services and job cards</p>
          </div>
        </div>

      <Card>
        <CardHeader>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Approved Services</h3>
        </CardHeader>
        <CardBody>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && services.length === 0 && (
            <p className="text-gray-600">No approved services.</p>
          )}
          <div className="space-y-4">
            {services.map((s) => (
              <div key={s.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand-navy-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-brand-navy-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{s.serviceType}</div>
                      <div className="text-sm text-gray-600">{s.vehicle?.make} {s.vehicle?.model} ({s.vehicle?.year})</div>
                      <div className="text-xs text-gray-500">Job Card: {s.jobCardNumber || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {statusBadge(s.approvalStatus)}
                    {s.jobCardPdfUrl ? (
                      <a
                        href={s.jobCardPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
                      >
                        <FileDown className="w-4 h-4 mr-2" /> Download Job Card
                      </a>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => generateJobCard(s.id)}
                        disabled={genId === s.id}
                      >
                        {genId === s.id ? 'Generating…' : 'Generate Job Card'}
                      </Button>
                    )}
                  </div>
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
