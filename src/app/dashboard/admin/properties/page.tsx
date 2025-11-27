'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Home, Plus, Edit2, Trash2, X, MapPin, DollarSign } from 'lucide-react';
import { ExportButtons } from '@/components/admin/ExportButtons';
import { formatCurrencyGHS } from '@/lib/utils';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setProperties(data.properties || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      title: String(fd.get('title')),
      description: String(fd.get('description')),
      propertyType: String(fd.get('propertyType')),
      status: String(fd.get('status')) || 'AVAILABLE',
      address: String(fd.get('address')),
      city: String(fd.get('city')),
      state: String(fd.get('state')),
      zipCode: String(fd.get('zipCode')),
      price: Number(fd.get('price')),
      size: fd.get('size') ? Number(fd.get('size')) : undefined,
      bedrooms: fd.get('bedrooms') ? Number(fd.get('bedrooms')) : undefined,
      bathrooms: fd.get('bathrooms') ? Number(fd.get('bathrooms')) : undefined,
      yearBuilt: fd.get('yearBuilt') ? Number(fd.get('yearBuilt')) : undefined,
      features: String(fd.get('features')).split(',').map(f => f.trim()).filter(Boolean),
      surveyConducted: fd.get('surveyConducted') === 'true',
      surveyReport: String(fd.get('surveyReport')) || undefined,
    };

    try {
      const url = editingId ? `/api/properties/${editingId}` : '/api/properties';
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

  const deleteProperty = async (id: string) => {
    if (!confirm('Delete this property listing?')) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const editing = properties.find(p => p.id === editingId);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'AVAILABLE': return <Badge variant="success">Available</Badge>;
      case 'SOLD': return <Badge variant="info">Sold</Badge>;
      case 'RENTED': return <Badge variant="info">Rented</Badge>;
      case 'UNDER_CONTRACT': return <Badge variant="warning">Under Contract</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-4 space-y-4 md:space-y-0 bg-white rounded-2xl shadow-xl p-8 border-t-4 border-rose-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">Property Management</h2>
            <p className="text-gray-600 text-lg mt-2">Manage property listings and inquiries</p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButtons type="properties" />
            <Button onClick={()=>{setShowForm(true); setEditingId(null);}} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all">
              <Plus className="w-5 h-5 mr-2"/> Add Property
            </Button>
          </div>
        </div>

      {showForm && (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-rose-50 to-pink-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">{editingId ? 'Edit Property' : 'Add Property'}</h3>
              <button onClick={()=>{setShowForm(false); setEditingId(null);}} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5"/>
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input name="title" label="Title" defaultValue={editing?.title || ''} required />
              <TextArea name="description" label="Description" defaultValue={editing?.description || ''} rows={3} required />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Type</label>
                  <select name="propertyType" defaultValue={editing?.propertyType || 'SALE'} className="w-full px-3 py-2 border rounded-lg" required>
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                    <option value="LEASE">For Lease</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" defaultValue={editing?.status || 'AVAILABLE'} className="w-full px-3 py-2 border rounded-lg">
                    <option value="AVAILABLE">Available</option>
                    <option value="UNDER_CONTRACT">Under Contract</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>
              </div>

              <Input name="address" label="Address" defaultValue={editing?.address || ''} required />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input name="city" label="City" defaultValue={editing?.city || ''} required />
                <Input name="state" label="State" defaultValue={editing?.state || ''} required />
                <Input name="zipCode" label="Zip Code" defaultValue={editing?.zipCode || ''} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="price" label="Price (GHS)" type="number" step="0.01" defaultValue={editing?.price || ''} required />
                <Input name="size" label="Size (sq ft)" type="number" defaultValue={editing?.size || ''} />
                <Input name="bedrooms" label="Bedrooms" type="number" defaultValue={editing?.bedrooms || ''} />
                <Input name="bathrooms" label="Bathrooms" type="number" step="0.5" defaultValue={editing?.bathrooms || ''} />
                <Input name="yearBuilt" label="Year Built" type="number" defaultValue={editing?.yearBuilt || ''} />
              </div>

              <Input name="features" label="Features (comma-separated)" defaultValue={editing?.features?.join(', ') || ''} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Survey Conducted</label>
                  <select name="surveyConducted" defaultValue={String(editing?.surveyConducted || false)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <Input name="surveyReport" label="Survey Report URL" defaultValue={editing?.surveyReport || ''} />
              </div>

              <div className="flex space-x-2">
                <Button type="submit">{editingId ? 'Update' : 'Add'} Property</Button>
                <Button type="button" variant="outline" onClick={()=>{setShowForm(false); setEditingId(null);}}>Cancel</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && properties.length === 0 && <p className="text-gray-600">No properties listed yet.</p>}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {properties.map(p => (
              <div key={p.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Home className="w-5 h-5 text-brand-navy-600" />
                      <h3 className="font-semibold">{p.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                  </div>
                  {statusBadge(p.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4"/>
                    <span>{p.address}, {p.city}, {p.state}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <DollarSign className="w-4 h-4"/>
                    <span className="font-medium text-brand-navy-700">{formatCurrencyGHS(p.price)}</span>
                  </div>
                  {p.bedrooms && <span className="text-gray-600">{p.bedrooms} bed • {p.bathrooms} bath • {p.size} sq ft</span>}
                  {p.inquiries && p.inquiries.length > 0 && <div className="text-gray-600">{p.inquiries.length} inquiries</div>}
                </div>

                <div className="flex space-x-2 mt-4">
                  <button onClick={()=>{setEditingId(p.id); setShowForm(true);}} className="p-2 hover:bg-gray-100 rounded">
                    <Edit2 className="w-4 h-4 text-gray-600"/>
                  </button>
                  <button onClick={()=>deleteProperty(p.id)} className="p-2 hover:bg-gray-100 rounded">
                    <Trash2 className="w-4 h-4 text-red-600"/>
                  </button>
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
