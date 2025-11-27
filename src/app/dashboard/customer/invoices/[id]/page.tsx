'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import DocumentGallery from '@/components/admin/DocumentGallery';
import { ArrowLeft, Calendar, DollarSign, FileText, Loader2, CreditCard, Shield, Download } from 'lucide-react';
import { formatDate, formatCurrencyGHS } from '@/lib/utils';

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
  dueDate: string;
  paidAt?: string;
  notes?: string;
  warrantyMonths?: number;
  discountPercentage?: number;
  discountAmount?: number;
  discountReason?: string;
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

export default function CustomerInvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [params.id]);

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
  const warrantyExpiry = invoice.automotiveService && invoice.warrantyMonths
    ? new Date(new Date().setMonth(new Date().getMonth() + invoice.warrantyMonths))
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
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Invoice Details
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Invoice: <span className="font-mono font-semibold">{invoice.invoiceNumber}</span>
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
          {/* Invoice Details */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Invoice Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500">Description</p>
                <p className="text-neutral-900 font-medium">{invoice.description}</p>
              </div>
              {invoice.automotiveService && (
                <div className="pt-3 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500">Related Service</p>
                  <p className="font-medium text-neutral-900">{invoice.automotiveService.serviceType}</p>
                  <p className="text-sm text-neutral-600 mt-1">
                    {invoice.automotiveService.vehicle.year}{' '}
                    {invoice.automotiveService.vehicle.make}{' '}
                    {invoice.automotiveService.vehicle.model}
                    {invoice.automotiveService.vehicle.licensePlate && (
                      <span className="font-mono ml-2">({invoice.automotiveService.vehicle.licensePlate})</span>
                    )}
                  </p>
                </div>
              )}
              {invoice.notes && (
                <div className="pt-3 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500">Notes</p>
                  <p className="text-neutral-700 mt-1">{invoice.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-brand-navy-600" />
                Payment History
              </h2>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div>
                      <p className="font-semibold text-neutral-900 text-lg">{formatCurrencyGHS(payment.amount)}</p>
                      <p className="text-sm text-neutral-600 mt-1">
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

          {/* Documents */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <FileText size={20} className="text-brand-navy-600" />
              Invoice & Receipt Documents
            </h2>
            <DocumentGallery
              invoiceId={invoice.id}
              allowDelete={false}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-brand-navy-600" />
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
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-semibold">
                    -{invoice.discountPercentage
                      ? `${invoice.discountPercentage}%`
                      : formatCurrencyGHS(invoice.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t-2 border-neutral-300 flex justify-between">
                <span className="text-xl font-bold">Total</span>
                <span className="text-xl font-bold text-brand-navy-900">
                  {formatCurrencyGHS(invoice.total)}
                </span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600 pt-2">
                    <span>Amount Paid</span>
                    <span className="font-semibold">{formatCurrencyGHS(invoice.amountPaid)}</span>
                  </div>
                  {balance > 0 && (
                    <div className="flex justify-between text-brand-red-600">
                      <span className="font-bold">Balance Due</span>
                      <span className="font-bold text-lg">{formatCurrencyGHS(balance)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {invoice.discountReason && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">Discount Reason</p>
                <p className="text-sm text-neutral-700 italic mt-1">{invoice.discountReason}</p>
              </div>
            )}
          </Card>

          {/* Warranty */}
          {invoice.warrantyMonths && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-green-600" />
                Warranty
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-neutral-500">Warranty Period</p>
                  <p className="text-xl font-bold text-green-600">
                    {invoice.warrantyMonths} {invoice.warrantyMonths === 1 ? 'Month' : 'Months'}
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

          {/* Dates */}
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-brand-navy-600" />
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
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Payment Method</h3>
              <p className="font-medium text-neutral-900">{invoice.paymentMethod}</p>
            </Card>
          )}

          {/* Need Help */}
          <Card className="bg-brand-navy-50">
            <h3 className="text-lg font-semibold text-brand-navy-900 mb-2">Need Help?</h3>
            <p className="text-sm text-neutral-700 mb-4">
              If you have questions about this invoice, please contact us.
            </p>
            <Button variant="primary" size="sm" className="w-full">
              Contact Support
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
