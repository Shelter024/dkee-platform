'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import DocumentUploadForm from '@/components/admin/DocumentUploadForm';
import DocumentGallery from '@/components/admin/DocumentGallery';
import { ArrowLeft, User, Calendar, DollarSign, FileText, Loader2, CreditCard } from 'lucide-react';
import { formatDate, formatCurrency, formatCurrencyGHS } from '@/lib/utils';

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  description: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  paymentStatus: string;
  paymentMethod?: string;
  transactionRef?: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  warrantyMonths?: number;
  discountPercentage?: number;
  discountAmount?: number;
  discountReason?: string;
  customer: {
    id: string;
    user: {
      name: string;
      email: string;
      phone?: string;
    };
    address?: string;
  };
  automotiveService?: {
    id: string;
    serviceType: string;
    vehicle: {
      make: string;
      model: string;
      year: number;
      licensePlate?: string;
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    reference?: string;
    createdAt: string;
  }>;
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice details');
      }

      const data = await response.json();
      setInvoice(data.invoice);
    } catch (err: any) {
      setError(err.message || 'Error loading invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [params.id, refreshKey]);

  const handleDocumentUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
      UNPAID: 'danger',
      PARTIALLY_PAID: 'warning',
      PAID: 'success',
      OVERDUE: 'danger',
      REFUNDED: 'info',
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

  if (error || !invoice) {
    return (
      <div className="p-6">
        <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-6 py-4 rounded-lg">
          {error || 'Invoice not found'}
        </div>
      </div>
    );
  }

  const balance = invoice.total - invoice.amountPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-500">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-700 font-semibold"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Invoice Details
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Invoice: <span className="font-mono font-semibold text-purple-700">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>
          <Badge variant={getPaymentStatusColor(invoice.paymentStatus)}>
            {invoice.paymentStatus.replace('_', ' ')}
          </Badge>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-4">Customer Information</h2>
            <div className="flex items-start gap-3">
              <User size={20} className="text-brand-navy-600 mt-1" />
              <div>
                <p className="font-medium text-neutral-900">{invoice.customer.user.name}</p>
                <p className="text-sm text-neutral-600">{invoice.customer.user.email}</p>
                {invoice.customer.user.phone && (
                  <p className="text-sm text-neutral-600">{invoice.customer.user.phone}</p>
                )}
                {invoice.customer.address && (
                  <p className="text-sm text-neutral-600 mt-1">{invoice.customer.address}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Invoice Details */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Invoice Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500">Description</p>
                <p className="text-neutral-700">{invoice.description}</p>
              </div>
              {invoice.automotiveService && (
                <div>
                  <p className="text-sm text-neutral-500">Related Service</p>
                  <p className="font-medium text-neutral-900">{invoice.automotiveService.serviceType}</p>
                  <p className="text-sm text-neutral-600">
                    {invoice.automotiveService.vehicle.year}{' '}
                    {invoice.automotiveService.vehicle.make}{' '}
                    {invoice.automotiveService.vehicle.model}
                    {invoice.automotiveService.vehicle.licensePlate && (
                      <span className="font-mono"> ({invoice.automotiveService.vehicle.licensePlate})</span>
                    )}
                  </p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-sm text-neutral-500">Notes</p>
                  <p className="text-neutral-700">{invoice.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <CreditCard size={24} className="text-emerald-600" />
                Payment History
              </h2>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{formatCurrencyGHS(payment.amount)}</p>
                      <p className="text-sm text-neutral-600">
                        {payment.method}
                        {payment.reference && <span className="ml-2 font-mono">({payment.reference})</span>}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-500">
                      {formatDate(new Date(payment.createdAt))}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documents Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Invoice & Receipt Documents</h2>
            
            {/* Upload Form */}
            <DocumentUploadForm
              invoiceId={invoice.id}
              documentType="RECEIPT_SCAN"
              showMetadata={true}
              onUploadSuccess={handleDocumentUpdate}
            />

            {/* Document Gallery */}
            <DocumentGallery
              invoiceId={invoice.id}
              allowDelete={true}
              onUpdate={handleDocumentUpdate}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-violet-50">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <DollarSign size={24} className="text-purple-600" />
              Amount Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium">{formatCurrencyGHS(invoice.subtotal)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tax</span>
                  <span className="font-medium">{formatCurrencyGHS(invoice.tax)}</span>
                </div>
              )}
              {(invoice.discountPercentage || invoice.discountAmount) && (
                <div className="flex justify-between text-brand-red-600">
                  <span>Discount</span>
                  <span className="font-medium">
                    {invoice.discountPercentage
                      ? `${invoice.discountPercentage}%`
                      : formatCurrencyGHS(invoice.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-neutral-200 flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-brand-navy-900">
                  {formatCurrencyGHS(invoice.total)}
                </span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span className="font-medium">{formatCurrencyGHS(invoice.amountPaid)}</span>
                  </div>
                  {balance > 0 && (
                    <div className="flex justify-between text-brand-red-600">
                      <span className="font-semibold">Balance Due</span>
                      <span className="font-bold">{formatCurrencyGHS(balance)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {invoice.warrantyMonths && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">Warranty Period</p>
                <p className="text-lg font-semibold text-green-600">
                  {invoice.warrantyMonths} {invoice.warrantyMonths === 1 ? 'Month' : 'Months'}
                </p>
              </div>
            )}

            {invoice.discountReason && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">Discount Reason</p>
                <p className="text-sm text-neutral-700">{invoice.discountReason}</p>
              </div>
            )}
          </Card>

          {/* Dates */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <Calendar size={24} className="text-blue-600" />
              Important Dates
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500">Due Date</p>
                <p className="font-medium text-neutral-900">
                  {formatDate(new Date(invoice.dueDate))}
                </p>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="text-sm text-neutral-500">Paid Date</p>
                  <p className="font-medium text-green-600">
                    {formatDate(new Date(invoice.paidAt))}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Method */}
          {invoice.paymentMethod && (
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-emerald-50 to-green-50">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">Payment Method</h3>
              <p className="font-medium text-neutral-900">{invoice.paymentMethod}</p>
              {invoice.transactionRef && (
                <p className="text-sm text-neutral-600 font-mono mt-1">
                  Ref: {invoice.transactionRef}
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
