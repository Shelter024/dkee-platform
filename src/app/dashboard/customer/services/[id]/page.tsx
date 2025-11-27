'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import DocumentGallery from '@/components/admin/DocumentGallery';
import { ArrowLeft, Car, Calendar, DollarSign, Wrench, FileText, Loader2, Shield } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ServiceDetail {
  id: string;
  serviceType: string;
  description: string;
  status: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  completedDate?: string;
  jobCardNumber?: string;
  warrantyMonths?: number;
  discountAmount?: number;
  discountReason?: string;
  diagnosis?: string;
  workPerformed?: string;
  recommendations?: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  assignedTo?: {
    name: string;
  };
}

export default function CustomerServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchService = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/services/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch service details');
      }

      const data = await response.json();
      setService(data.service);
    } catch (err: any) {
      setError(err.message || 'Error loading service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, [params.id]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
      PENDING: 'warning',
      IN_PROGRESS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-brand-navy-600" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="p-6">
        <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-6 py-4 rounded-lg">
          {error || 'Service not found'}
        </div>
      </div>
    );
  }

  const warrantyExpiry = service.completedDate && service.warrantyMonths
    ? new Date(new Date(service.completedDate).setMonth(new Date(service.completedDate).getMonth() + service.warrantyMonths))
    : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Services
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Service Details
            </h1>
            {service.jobCardNumber && (
              <p className="text-sm text-neutral-600 mt-1">
                Job Card: <span className="font-mono font-semibold">{service.jobCardNumber}</span>
              </p>
            )}
          </div>
        </div>
        <Badge variant={getStatusColor(service.status)}>
          {service.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Info */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Car size={20} className="text-brand-navy-600" />
              Vehicle Information
            </h2>
            <div>
              <p className="text-xl font-semibold text-neutral-900">
                {service.vehicle.year} {service.vehicle.make} {service.vehicle.model}
              </p>
              {service.vehicle.licensePlate && (
                <p className="text-sm text-neutral-600 font-mono mt-1">
                  License Plate: {service.vehicle.licensePlate}
                </p>
              )}
            </div>
          </Card>

          {/* Service Details */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Service Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500">Service Type</p>
                <p className="font-medium text-neutral-900 text-lg">{service.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Description</p>
                <p className="text-neutral-700">{service.description}</p>
              </div>
              {service.diagnosis && (
                <div className="pt-3 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500 font-semibold">Diagnosis</p>
                  <p className="text-neutral-700 mt-1">{service.diagnosis}</p>
                </div>
              )}
              {service.workPerformed && (
                <div className="pt-3 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500 font-semibold">Work Performed</p>
                  <p className="text-neutral-700 mt-1">{service.workPerformed}</p>
                </div>
              )}
              {service.recommendations && (
                <div className="pt-3 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500 font-semibold">Recommendations</p>
                  <p className="text-neutral-700 mt-1">{service.recommendations}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Documents */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <FileText size={20} className="text-brand-navy-600" />
              Job Card & Documents
            </h2>
            <DocumentGallery
              automotiveServiceId={service.id}
              allowDelete={false}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Information */}
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-brand-navy-600" />
              Cost
            </h3>
            <div className="space-y-3">
              {service.estimatedCost !== undefined && service.status === 'PENDING' && (
                <div>
                  <p className="text-sm text-neutral-500">Estimated Cost</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(service.estimatedCost)}
                  </p>
                </div>
              )}
              {service.actualCost !== undefined && service.status !== 'PENDING' && (
                <div>
                  <p className="text-sm text-neutral-500">Total Cost</p>
                  <p className="text-2xl font-bold text-brand-navy-900">
                    {formatCurrency(service.actualCost)}
                  </p>
                </div>
              )}
              {service.discountAmount && (
                <div className="pt-2 border-t border-neutral-200">
                  <p className="text-sm text-neutral-500">Discount Applied</p>
                  <p className="text-xl font-semibold text-green-600">
                    -{formatCurrency(service.discountAmount)}
                  </p>
                  {service.discountReason && (
                    <p className="text-xs text-neutral-600 mt-1 italic">{service.discountReason}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Warranty Information */}
          {service.warrantyMonths && service.completedDate && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-green-600" />
                Warranty
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-neutral-500">Warranty Period</p>
                  <p className="text-xl font-bold text-green-600">
                    {service.warrantyMonths} {service.warrantyMonths === 1 ? 'Month' : 'Months'}
                  </p>
                </div>
                {warrantyExpiry && (
                  <div>
                    <p className="text-sm text-neutral-500">Valid Until</p>
                    <p className="font-medium text-neutral-900">
                      {formatDate(warrantyExpiry)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-brand-navy-600" />
              Timeline
            </h3>
            <div className="space-y-3">
              {service.scheduledDate && (
                <div>
                  <p className="text-sm text-neutral-500">Scheduled</p>
                  <p className="font-medium text-neutral-900">
                    {formatDate(new Date(service.scheduledDate))}
                  </p>
                </div>
              )}
              {service.completedDate && (
                <div>
                  <p className="text-sm text-neutral-500">Completed</p>
                  <p className="font-medium text-green-600">
                    {formatDate(new Date(service.completedDate))}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Technician */}
          {service.assignedTo && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Wrench size={20} className="text-brand-navy-600" />
                Assigned Technician
              </h3>
              <p className="font-medium text-neutral-900">
                {service.assignedTo.name}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
