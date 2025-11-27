'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Car, Search, Eye } from 'lucide-react';
import { ExportButtons } from '@/components/admin/ExportButtons';

export default function AdminVehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  const filtered = vehicles.filter(v =>
    v.make?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.licensePlate?.toLowerCase().includes(search.toLowerCase()) ||
    v.customer?.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-4 space-y-4 md:space-y-0 bg-white rounded-2xl shadow-xl p-8 border-t-4 border-cyan-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">Vehicle Management</h2>
            <p className="text-gray-600 text-lg mt-2">View all registered vehicles and service history</p>
          </div>
          <ExportButtons type="vehicles" />
        </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-400"/>
            <input
              type="text"
              placeholder="Search by make, model, registration, or customer..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
          </div>
        </CardHeader>
        <CardBody>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && filtered.length === 0 && <p className="text-gray-600">No vehicles found.</p>}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Plate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-brand-navy-100 rounded-lg flex items-center justify-center">
                          <Car className="w-5 h-5 text-brand-navy-600" />
                        </div>
                        <div>
                          <div className="font-medium">{v.make} {v.model}</div>
                          <div className="text-sm text-gray-600">{v.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{v.licensePlate}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{v.customer?.user?.name}</div>
                      <div className="text-sm text-gray-600">{v.customer?.user?.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{v.services?.length || 0} service(s)</td>
                    <td className="px-6 py-4 text-sm">
                      {v.color && <div>Color: {v.color}</div>}
                      {v.vin && <div className="text-xs text-gray-600">VIN: {v.vin}</div>}
                      {v.mileage && <div className="text-xs text-gray-600">Mileage: {v.mileage.toLocaleString()} km</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => router.push(`/dashboard/admin/vehicles/${v.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
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
