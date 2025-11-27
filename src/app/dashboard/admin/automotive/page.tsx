'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { 
  Wrench, CheckCircle, XCircle, Clock, User, Car, 
  Calendar, DollarSign, RefreshCw, ChevronDown, ChevronUp 
} from 'lucide-react';
import { ExportButtons } from '@/components/admin/ExportButtons';

export default function AdminAutomotivePage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const url = `/api/services${filter ? `?approvalStatus=${filter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setServices(data.services || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id: string) => {
    try {
      setProcessing(id);
      const res = await fetch(`/api/services/${id}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to approve');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (id: string, reason: string) => {
    try {
      setProcessing(id);
      const res = await fetch(`/api/services/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to reject');
      await load();
      setExpandedId(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setProcessing(id);
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const updateJobCard = async (id: string, formData: any) => {
    try {
      setProcessing(id);
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update');
      await load();
      setExpandedId(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'IN_PROGRESS': return <Badge variant="info">In Progress</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  const approvalBadge = (s: string) => {
    switch (s) {
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'PENDING': return <Badge variant="warning">Awaiting</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automotive Services</h2>
          <p className="text-gray-600 mt-1">Manage service requests, approvals, and job cards</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons type="services" />
          <button onClick={load} className="inline-flex items-center px-3 py-2 text-sm rounded-lg border hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 mr-2"/> Refresh
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Service Requests</h3>
            <select value={filter} onChange={e=>setFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">All</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && services.length === 0 && <p className="text-gray-600">No services found.</p>}
          
          <div className="space-y-4">
            {services.map(svc => (
              <div key={svc.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand-navy-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-brand-navy-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{svc.serviceType}</div>
                      <div className="text-sm text-gray-600">{svc.description}</div>
                      <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                        <Car className="w-4 h-4"/>
                        <span>{svc.vehicle?.make} {svc.vehicle?.model} ({svc.vehicle?.year}) - {svc.vehicle?.registrationNumber}</span>
                                              <span>{svc.vehicle?.make} {svc.vehicle?.model} ({svc.vehicle?.year}) - {svc.vehicle?.licensePlate}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                        <User className="w-4 h-4"/>
                        <span>{svc.customer?.user?.name} - {svc.customer?.user?.phone}</span>
                      </div>
                      {svc.scheduledDate && (
                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4"/>
                          <span>{new Date(svc.scheduledDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {statusBadge(svc.status)}
                    {approvalBadge(svc.approvalStatus)}
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  {svc.approvalStatus === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={()=>approve(svc.id)} disabled={processing===svc.id}>
                        <CheckCircle className="w-4 h-4 mr-1"/> Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={()=>setExpandedId(expandedId===svc.id?null:svc.id)}>
                        <XCircle className="w-4 h-4 mr-1"/> Reject
                      </Button>
                    </>
                  )}
                  {svc.approvalStatus === 'APPROVED' && (
                    <>
                      {svc.status === 'PENDING' && (
                        <Button size="sm" onClick={()=>updateStatus(svc.id, 'IN_PROGRESS')} disabled={processing===svc.id}>
                          Start Work
                        </Button>
                      )}
                      {svc.status === 'IN_PROGRESS' && (
                        <Button size="sm" onClick={()=>updateStatus(svc.id, 'COMPLETED')} disabled={processing===svc.id}>
                          Mark Completed
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={()=>setExpandedId(expandedId===svc.id?null:svc.id)}>
                        {expandedId===svc.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        {expandedId===svc.id ? 'Hide' : 'Job Card Details'}
                      </Button>
                    </>
                  )}
                </div>

                {expandedId === svc.id && (
                  <div className="mt-4 p-4 bg-gray-50 border-t rounded">
                    {svc.approvalStatus === 'PENDING' && (
                      <form onSubmit={(e)=>{
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget as HTMLFormElement);
                        reject(svc.id, String(fd.get('reason')));
                      }}>
                        <TextArea name="reason" label="Rejection Reason" rows={3} required />
                        <Button type="submit" variant="danger" className="mt-3" disabled={processing===svc.id}>
                          Submit Rejection
                        </Button>
                      </form>
                    )}
                    {svc.approvalStatus === 'APPROVED' && (
                      <form onSubmit={(e)=>{
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget as HTMLFormElement);
                        updateJobCard(svc.id, {
                          diagnosis: String(fd.get('diagnosis')),
                          workPerformed: String(fd.get('workPerformed')),
                          partsUsed: String(fd.get('partsUsed')),
                          laborCharges: Number(fd.get('laborCharges')),
                          recommendations: String(fd.get('recommendations')),
                          technicianName: String(fd.get('technicianName')),
                          estimatedCompletion: String(fd.get('estimatedCompletion')) || undefined,
                        });
                      }} className="space-y-3">
                        <TextArea name="diagnosis" label="Diagnosis" defaultValue={svc.diagnosis || ''} rows={2} />
                        <TextArea name="workPerformed" label="Work Performed" defaultValue={svc.workPerformed || ''} rows={3} />
                        <TextArea name="partsUsed" label="Parts Used (JSON format)" defaultValue={svc.partsUsed || ''} rows={2} />
                        <Input name="laborCharges" label="Labor Charges (GHS)" type="number" step="0.01" defaultValue={svc.laborCharges || ''} />
                        <TextArea name="recommendations" label="Recommendations" defaultValue={svc.recommendations || ''} rows={2} />
                        <Input name="technicianName" label="Technician Name" defaultValue={svc.technicianName || ''} />
                        <Input name="estimatedCompletion" label="Estimated Completion" type="datetime-local" defaultValue={svc.estimatedCompletion ? new Date(svc.estimatedCompletion).toISOString().slice(0,16) : ''} />
                        <Button type="submit" disabled={processing===svc.id}>
                          {processing===svc.id ? 'Saving...' : 'Update Job Card'}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
