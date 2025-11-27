'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Car, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type ApiService = {
  id: string;
  serviceType: string;
  description: string;
  status: string;
  approvalStatus: string;
  jobCardNumber?: string | null;
  jobCardPdfUrl?: string | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  vehicle: {
    make: string;
    model: string;
    year: number;
    registrationNumber?: string | null;
    licensePlate?: string | null;
  };
  invoice?: { id: string } | null;
};

type ApiVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  registrationNumber?: string | null;
  licensePlate?: string | null;
};

export default function CustomerServices() {
  const searchParams = useSearchParams();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [services, setServices] = useState<ApiService[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const service = searchParams.get('service');
    if (service) {
      setShowBookingForm(true);
      setSelectedServiceType(service);
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [svcRes, meRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/customers/me'),
        ]);
        if (!svcRes.ok) throw new Error('Failed to fetch services');
        if (!meRes.ok) throw new Error('Failed to fetch vehicles');
        const svcData = await svcRes.json();
        const meData = await meRes.json();
        if (mounted) {
          setServices(svcData.services || []);
          setVehicles(meData.customer?.vehicles || []);
        }
      } catch (e: any) {
        if (mounted) setError(e.message || 'Error loading data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">In Progress</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Awaiting Approval</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-brand-navy-600" />;
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'PENDING':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const payload = {
      vehicleId: selectedVehicle,
      serviceType: String(formData.get('serviceType') || ''),
      description: String(formData.get('description') || ''),
      estimatedCost: formData.get('estimatedCost')
        ? Number(formData.get('estimatedCost'))
        : undefined,
      scheduledDate: String(formData.get('scheduledDate') || ''),
    };
    try {
      setSubmitting(true);
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit service');
      const data = await res.json();
      setServices((prev) => [data.service, ...prev]);
      setShowBookingForm(false);
      form.reset();
      setSelectedVehicle('');
    } catch (e: any) {
      setError(e.message || 'Failed to submit service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-cyan-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
              My Services
            </h2>
            <p className="text-gray-600 text-lg">Track and manage your automotive services</p>
          </div>
          <Button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus className="w-6 h-6" />
            <span>Book Service</span>
          </Button>
        </div>

        {/* Booking Form */}
        {showBookingForm && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-cyan-50 to-teal-50">
            <CardHeader>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Book New Service</h3>
            </CardHeader>
            <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Vehicle
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy-500 focus:border-brand-navy-500"
                  required
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map((vehicle) => {
                    const plate = vehicle.registrationNumber || vehicle.licensePlate || '';
                    return (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.year}) {plate ? `- ${plate}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  name="serviceType"
                  value={selectedServiceType}
                  onChange={(e) => setSelectedServiceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy-500 focus:border-brand-navy-500"
                  required
                >
                  <option value="">Select service type...</option>
                  <option value="Oil Change">Oil Change</option>
                  <option value="Brake Service">Brake Service</option>
                  <option value="Engine Diagnostic">Engine Diagnostic</option>
                  <option value="Tire Service">Tire Service</option>
                  <option value="Battery Replacement">Battery Replacement</option>
                  <option value="Air Conditioning">Air Conditioning Service</option>
                  <option value="Transmission Service">Transmission Service</option>
                  <option value="Suspension Repair">Suspension Repair</option>
                  <option value="Vehicle Tracking Device">Vehicle Tracking Device Installation</option>
                  <option value="General Maintenance">General Maintenance</option>
                  <option value="Key Programming">Key Programming</option>
                  <option value="Body Works and Spraying">Body Works and Spraying</option>
                  <option value="24/7 Towing Service">24/7 Towing Service</option>
                  <option value="Training and Consultancy">Training and Consultancy</option>
                  <option value="Maintenance and Repair Services">Maintenance and Repair Services</option>
                  <option value="Diagnostic Services">Diagnostic Services</option>
                  <option value="Spare Parts Supply">Spare Parts Supply</option>
                  <option value="Vehicle Tracking">Vehicle Tracking</option>
                  <option value="Fleet Management">Fleet Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <TextArea
                name="description"
                label="Service Description"
                placeholder="Describe the issue or service needed in detail..."
                rows={4}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  name="scheduledDate"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy-500 focus:border-brand-navy-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <Input
                name="estimatedCost"
                label="Estimated Cost (Optional)"
                type="number"
                placeholder="GHS 0.00"
                step="0.01"
              />

              <div className="flex items-center space-x-3 pt-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  Submit Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Services List */}
      {loading && (
        <Card>
          <CardBody>
            <p className="text-gray-600">Loading services...</p>
          </CardBody>
        </Card>
      )}
      {error && (
        <Card>
          <CardBody>
            <p className="text-red-600">{error}</p>
          </CardBody>
        </Card>
      )}
      <div className="space-y-4">
        {services.map((service) => (
          <Card key={service.id} className="hover-lift">
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-brand-navy-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(service.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.serviceType}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        {getStatusBadge(service.status)}
                        {getApprovalBadge(service.approvalStatus)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-3">
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>
                          {service.vehicle.make} {service.vehicle.model} ({service.vehicle.year})
                          {service.vehicle.registrationNumber || service.vehicle.licensePlate
                            ? ` - ${service.vehicle.registrationNumber || service.vehicle.licensePlate}`
                            : ''}
                        </span>
                      </div>
                      {service.jobCardNumber && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-brand-navy-600">
                            Job Card: {service.jobCardNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Scheduled: {service.scheduledDate ? new Date(service.scheduledDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {service.completedDate && (
                        <span>
                          Completed: {new Date(service.completedDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 mt-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {service.jobCardPdfUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(service.jobCardPdfUrl as string, '_blank')}
                        >
                          Download Job Card
                        </Button>
                      )}
                      {service.invoice?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => (window.location.href = '/dashboard/customer/invoices')}
                        >
                          View Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't booked any services yet. Get started by booking your first service.
            </p>
            <Button onClick={() => setShowBookingForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Book Your First Service
            </Button>
          </CardBody>
        </Card>
      )}
      </div>
    </div>
  );
}
