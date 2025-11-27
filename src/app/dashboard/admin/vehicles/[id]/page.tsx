'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  ArrowLeft,
  FileText,
  Receipt as ReceiptIcon,
  History,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Wrench,
} from 'lucide-react';
import { formatCurrencyGHS } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  trackingDevice: boolean;
  customer: {
    user: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  description: string;
  total: number;
  paymentStatus: string;
  dueDate: string;
  pdfUrl?: string;
  createdAt: string;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  description?: string;
  pdfUrl?: string;
  createdAt: string;
}

interface JobHistory {
  id: string;
  jobType: string;
  description: string;
  startDate: string;
  completionDate?: string;
  totalCost?: number;
  performedByUser?: {
    name: string;
  };
  pdfUrl?: string;
}

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts' | 'history'>('invoices');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch vehicle details
      const vehicleRes = await fetch(`/api/vehicles/${params.id}`);
      if (!vehicleRes.ok) throw new Error('Failed to fetch vehicle');
      const vehicleData = await vehicleRes.json();
      setVehicle(vehicleData);

      // Fetch invoices
      const invoicesRes = await fetch(`/api/vehicles/${params.id}/invoices`);
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }

      // Fetch receipts
      const receiptsRes = await fetch(`/api/vehicles/${params.id}/receipts`);
      if (receiptsRes.ok) {
        const receiptsData = await receiptsRes.json();
        setReceipts(receiptsData);
      }

      // Fetch job history
      const historyRes = await fetch(`/api/vehicles/${params.id}/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setJobHistory(historyData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('PDF not available');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <p className="text-gray-600">Vehicle not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </h1>
          <p className="text-gray-600">{vehicle.licensePlate || 'No license plate'}</p>
        </div>
      </div>

      {/* Vehicle Info */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">VIN</p>
            <p className="font-medium">{vehicle.vin || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Color</p>
            <p className="font-medium">{vehicle.color || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mileage</p>
            <p className="font-medium">
              {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vehicle Tracking Device</p>
            <Badge variant={vehicle.trackingDevice ? 'success' : 'default'}>
              {vehicle.trackingDevice ? 'Installed' : 'Not Installed'}
            </Badge>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">Owner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{vehicle.customer.user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{vehicle.customer.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{vehicle.customer.user.phone}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-brand-navy-600 text-brand-navy-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Invoices ({invoices.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'receipts'
                  ? 'border-brand-navy-600 text-brand-navy-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4" />
                <span>Receipts ({receipts.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-brand-navy-600 text-brand-navy-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Job History ({jobHistory.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No invoices found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 text-sm">{invoice.description}</td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {formatCurrencyGHS(invoice.total)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                invoice.paymentStatus === 'PAID'
                                  ? 'success'
                                  : invoice.paymentStatus === 'PARTIALLY_PAID'
                                  ? 'warning'
                                  : 'default'
                              }
                            >
                              {invoice.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              onClick={() => handleDownload(invoice.pdfUrl)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Receipts Tab */}
          {activeTab === 'receipts' && (
            <div className="space-y-4">
              {receipts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No receipts found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Receipt #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {receipts.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono">{receipt.receiptNumber}</td>
                          <td className="px-6 py-4 text-sm">{receipt.description || 'Payment'}</td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {formatCurrencyGHS(receipt.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm">{receipt.paymentMethod}</td>
                          <td className="px-6 py-4 text-sm">
                            {new Date(receipt.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              onClick={() => handleDownload(receipt.pdfUrl)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Job History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {jobHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No job history found</p>
              ) : (
                <div className="space-y-4">
                  {jobHistory.map((job) => (
                    <Card key={job.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-brand-navy-100 rounded-lg flex items-center justify-center">
                              <Wrench className="w-5 h-5 text-brand-navy-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{job.jobType}</h4>
                              <p className="text-sm text-gray-600">{job.description}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-gray-600">Start Date</p>
                              <p className="font-medium">
                                {new Date(job.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            {job.completionDate && (
                              <div>
                                <p className="text-gray-600">Completed</p>
                                <p className="font-medium">
                                  {new Date(job.completionDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {job.totalCost && (
                              <div>
                                <p className="text-gray-600">Cost</p>
                                <p className="font-medium">{formatCurrencyGHS(job.totalCost)}</p>
                              </div>
                            )}
                            {job.performedByUser && (
                              <div>
                                <p className="text-gray-600">Performed By</p>
                                <p className="font-medium">{job.performedByUser.name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDownload(job.pdfUrl)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
