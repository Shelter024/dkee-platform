'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import DocumentUploadForm from '@/components/admin/DocumentUploadForm';
import DocumentGallery from '@/components/admin/DocumentGallery';
import { ArrowLeft, Car, User, Calendar, DollarSign, Wrench, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ServiceDetail {
  id: string;
  serviceType: string;
  description: string;
  status: string;
  approvalStatus: string;
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
  technicianName?: string;
  customer: {
    id: string;
    user: {
      name: string;
      email: string;
      phone?: string;
    };
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  assignedTo?: {
    name: string;
  };
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [params.id, refreshKey]);

  const handleDocumentUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Service Details
            </h1>
            {service.jobCardNumber && (
              <p className="text-sm text-neutral-600 mt-1">
                Job Card: <span className="font-mono">{service.jobCardNumber}</span>
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
          {/* Customer & Vehicle Info */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Customer & Vehicle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-neutral-700">
                  <User size={18} className="text-brand-navy-600" />
                  <div>
                    <p className="text-sm text-neutral-500">Customer</p>
                    <p className="font-medium">{service.customer.user.name}</p>
                    <p className="text-sm text-neutral-600">{service.customer.user.email}</p>
                    {service.customer.user.phone && (
                      <p className="text-sm text-neutral-600">{service.customer.user.phone}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Car size={18} className="text-brand-navy-600" />
                  <div>
                    <p className="text-sm text-neutral-500">Vehicle</p>
                    <p className="font-medium">
                      {service.vehicle.year} {service.vehicle.make} {service.vehicle.model}
                    </p>
                    {service.vehicle.licensePlate && (
                      <p className="text-sm text-neutral-600 font-mono">
                        {service.vehicle.licensePlate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Service Details */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Service Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500">Service Type</p>
                <p className="font-medium text-neutral-900">{service.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Description</p>
                <p className="text-neutral-700">{service.description}</p>
              </div>
              {service.diagnosis && (
                <div>
                  <p className="text-sm text-neutral-500">Diagnosis</p>
                  <p className="text-neutral-700">{service.diagnosis}</p>
                </div>
              )}
              {service.workPerformed && (
                <div>
                  <p className="text-sm text-neutral-500">Work Performed</p>
                  <p className="text-neutral-700">{service.workPerformed}</p>
                </div>
              )}
              {service.recommendations && (
                <div>
                  <p className="text-sm text-neutral-500">Recommendations</p>
                  <p className="text-neutral-700">{service.recommendations}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Documents Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900">Job Card & Documents</h2>
            
            {/* Upload Form */}
            <DocumentUploadForm
              automotiveServiceId={service.id}
              documentType="JOBCARD_SCAN"
              showMetadata={true}
              onUploadSuccess={handleDocumentUpdate}
            />

            {/* Document Gallery */}
            <DocumentGallery
              automotiveServiceId={service.id}
              allowDelete={true}
              onUpdate={handleDocumentUpdate}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost & Payment */}
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-brand-navy-600" />
              Cost Information
            </h3>
            <div className="space-y-3">
              {service.estimatedCost !== undefined && (
                <div>
                  <p className="text-sm text-neutral-500">Estimated Cost</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {formatCurrency(service.estimatedCost)}
                  </p>
                </div>
              )}
              {service.actualCost !== undefined && (
                <div>
                  <p className="text-sm text-neutral-500">Actual Cost</p>
                  <p className="text-lg font-semibold text-brand-navy-900">
                    {formatCurrency(service.actualCost)}
                  </p>
                </div>
              )}
              {service.discountAmount && (
                <div className="pt-2 border-t border-neutral-200">
                  <p className="text-sm text-neutral-500">Discount Applied</p>
                  <p className="text-lg font-semibold text-brand-red-600">
                    -{formatCurrency(service.discountAmount)}
                  </p>
                  {service.discountReason && (
                    <p className="text-xs text-neutral-600 mt-1">{service.discountReason}</p>
                  )}
                </div>
              )}
              {service.warrantyMonths && (
                <div className="pt-2 border-t border-neutral-200">
                  <p className="text-sm text-neutral-500">Warranty Period</p>
                  <p className="text-lg font-semibold text-green-600">
                    {service.warrantyMonths} {service.warrantyMonths === 1 ? 'Month' : 'Months'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-brand-navy-600" />
              Timeline
            </h3>
            <div className="space-y-3">
              {service.scheduledDate && (
                <div>
                  <p className="text-sm text-neutral-500">Scheduled Date</p>
                  <p className="font-medium text-neutral-900">
                    {formatDate(new Date(service.scheduledDate))}
                  </p>
                </div>
              )}
              {service.completedDate && (
                <div>
                  <p className="text-sm text-neutral-500">Completed Date</p>
                  <p className="font-medium text-neutral-900">
                    {formatDate(new Date(service.completedDate))}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Technician */}
          {(service.assignedTo || service.technicianName) && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Wrench size={20} className="text-brand-navy-600" />
                Technician
              </h3>
              <p className="font-medium text-neutral-900">
                {service.assignedTo?.name || service.technicianName}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
