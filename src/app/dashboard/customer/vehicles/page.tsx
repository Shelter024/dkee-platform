'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VehicleSelector } from '@/components/ui/VehicleSelector';
import { Car, Plus, Edit2, Trash2, X, Eye } from 'lucide-react';

export default function CustomerVehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
    vin: '',
    mileage: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setVehicles(data.vehicles || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = {
      make: formData.make,
      model: formData.model,
      year: Number(formData.year),
      licensePlate: formData.licensePlate,
      color: formData.color || undefined,
      vin: formData.vin || undefined,
      mileage: formData.mileage ? Number(formData.mileage) : undefined,
    };

    try {
      const url = editingId ? `/api/vehicles/${editingId}` : '/api/vehicles';
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
      setFormData({
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        color: '',
        vin: '',
        mileage: '',
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const editVehicle = (v: any) => {
    setEditingId(v.id);
    setFormData({
      make: v.make,
      model: v.model,
      year: v.year.toString(),
      licensePlate: v.licensePlate || '',
      color: v.color || '',
      vin: v.vin || '',
      mileage: v.mileage?.toString() || '',
    });
    setShowForm(true);
  };

  const handleNewVehicle = () => {
    setEditingId(null);
    setFormData({
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      color: '',
      vin: '',
      mileage: '',
    });
    setShowForm(true);
  };

  const editing = vehicles.find(v => v.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Vehicles</h2>
          <p className="text-gray-600 mt-1">Manage your registered vehicles</p>
        </div>
        <Button onClick={handleNewVehicle}>
          <Plus className="w-4 h-4 mr-2"/> Add Vehicle
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button onClick={()=>{setShowForm(false); setEditingId(null);}} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5"/>
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <VehicleSelector
                defaultMake={formData.make}
                defaultModel={formData.model}
                defaultYear={formData.year}
                onMakeChange={(make) => setFormData({ ...formData, make })}
                onModelChange={(model) => setFormData({ ...formData, model })}
                onYearChange={(year) => setFormData({ ...formData, year })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="licensePlate"
                  label="License Plate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  required
                />
                <Input
                  name="color"
                  label="Color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <Input
                  name="vin"
                  label="VIN"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                />
                <Input
                  name="mileage"
                  label="Mileage (km)"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">{editingId ? 'Update' : 'Add'} Vehicle</Button>
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
          {!loading && vehicles.length === 0 && <p className="text-gray-600">No vehicles registered yet.</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map(v => (
              <div key={v.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-brand-navy-100 rounded-lg flex items-center justify-center">
                      <Car className="w-6 h-6 text-brand-navy-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{v.make} {v.model}</div>
                      <div className="text-sm text-gray-600">{v.year} • {v.licensePlate}</div>
                      {v.color && <div className="text-sm text-gray-600">Color: {v.color}</div>}
                      {v.vin && <div className="text-sm text-gray-600">VIN: {v.vin}</div>}
                      {v.mileage && <div className="text-sm text-gray-600">Mileage: {v.mileage.toLocaleString()} km</div>}
                      {v.services && v.services.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">{v.services.length} service(s)</div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => router.push(`/dashboard/customer/vehicles/${v.id}`)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="View details"
                    >
                      <Eye className="w-4 h-4 text-brand-navy-600" />
                    </button>
                    <button onClick={()=>editVehicle(v)} className="p-2 hover:bg-gray-100 rounded">
                      <Edit2 className="w-4 h-4 text-gray-600"/>
                    </button>
                    <button onClick={()=>deleteVehicle(v.id)} className="p-2 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4 text-red-600"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
