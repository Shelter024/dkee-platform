'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, Download, Eye, DollarSign, Calendar, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';
import { useInvoices } from '@/hooks/useSWR';
const PdfViewerModal = dynamic(() => import('@/components/pdf/PdfViewerModal').then(m => m.PdfViewerModal), { ssr: false, loading: () => <Skeleton lines={6} /> });

type ApiInvoice = {
  id: string;
  invoiceNumber: string;
  description: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  paymentStatus: string;
  createdAt: string;
  dueDate: string;
  pdfUrl?: string | null;
  automotiveService?: {
    id: string;
    serviceType: string | null;
    jobCardNumber: string | null;
  } | null;
};

export default function CustomerInvoices() {
  const { invoices, isLoading, isError } = useInvoices();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Record<string, any[]>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">Partially Paid</Badge>;
      case 'UNPAID':
        return <Badge variant="danger">Unpaid</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger">Overdue</Badge>;
      case 'REFUNDED':
        return <Badge variant="info">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDownload = async (invoice: ApiInvoice) => {
    if (!invoice.pdfUrl) return;
    try {
      const a = document.createElement('a');
      a.href = invoice.pdfUrl;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {}
  };

  const handleView = (invoice: ApiInvoice) => {
    if (!invoice.pdfUrl) return;
    setViewerUrl(invoice.pdfUrl);
    setViewerTitle(`Invoice ${invoice.invoiceNumber}`);
    setViewerOpen(true);
  };
  const { totalPaid, totalOutstanding } = useMemo(() => {
    const paid = invoices
      .filter((i) => i.paymentStatus === 'PAID')
      .reduce((sum, i) => sum + (i.amountPaid || 0), 0);
    const outstanding = invoices.reduce((sum, i) => sum + Math.max(i.total - (i.amountPaid || 0), 0), 0);
    return { totalPaid: paid, totalOutstanding: outstanding };
  }, [invoices]);

  const [payLoadingId, setPayLoadingId] = useState<string | null>(null);

  const handlePayNow = async (invoice: ApiInvoice) => {
    try {
      setPayLoadingId(invoice.id);
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Payment init failed');
      window.location.href = data.authorizationUrl;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPayLoadingId(null);
    }
  };

  const togglePaymentHistory = async (invoiceId: string) => {
    if (expandedInvoice === invoiceId) {
      setExpandedInvoice(null);
      return;
    }
    setExpandedInvoice(invoiceId);
    if (!paymentHistory[invoiceId]) {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        const data = await res.json();
        if (res.ok && data.invoice?.payments) {
          setPaymentHistory(prev => ({ ...prev, [invoiceId]: data.invoice.payments }));
        }
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-500">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
            Invoices & Payments
          </h2>
          <p className="text-gray-600 text-lg">View and manage your invoices and payment history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Total Invoices</p>
                  <p className="text-5xl font-bold">{invoices.length}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <FileText className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Total Paid</p>
                  <p className="text-4xl font-bold">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <CheckCircle className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-rose-400 via-red-500 to-pink-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Outstanding</p>
                  <p className="text-4xl font-bold">
                    {formatCurrency(totalOutstanding)}
                  </p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <DollarSign className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

      {/* Loading / Error */}
      {isLoading && (
        <Card>
          <CardBody>
            <Skeleton lines={5} />
          </CardBody>
        </Card>
      )}
      {isError && (
        <Card>
          <CardBody>
            <p className="text-red-600">Failed to load invoices. Please refresh the page.</p>
          </CardBody>
        </Card>
      )}

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">All Invoices</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-brand-navy-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-brand-navy-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-brand-navy-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {invoice.invoiceNumber}
                          </h4>
                          <p className="text-sm text-gray-600">{invoice.description}</p>
                        </div>
                        {getPaymentStatusBadge(invoice.paymentStatus)}
                      </div>
                      {invoice.automotiveService?.serviceType && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <span className="font-medium">{invoice.automotiveService.serviceType}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Issued: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600">
                            Total: <span className="font-semibold text-gray-900">{formatCurrency(invoice.total)}</span>
                          </div>
                          {invoice.paymentStatus === 'PARTIALLY_PAID' && (
                            <div className="text-sm text-gray-600 mt-1">
                              Paid: {formatCurrency(invoice.amountPaid || 0)} •{' '}
                              Balance: {formatCurrency(Math.max(invoice.total - (invoice.amountPaid || 0), 0))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {invoice.pdfUrl && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(invoice)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(invoice)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </>
                          )}
                          {invoice.paymentStatus !== 'PAID' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handlePayNow(invoice)}
                              disabled={payLoadingId === invoice.id}
                            >
                              {payLoadingId === invoice.id ? 'Redirecting…' : 'Pay Now'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePaymentHistory(invoice.id)}
                          >
                            {expandedInvoice === invoice.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {expandedInvoice === invoice.id && (
                  <div className="mt-4 p-3 bg-gray-50 border-t">
                    <h4 className="font-semibold text-sm mb-2">Payment History</h4>
                    {paymentHistory[invoice.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {paymentHistory[invoice.id].map((payment: any) => (
                          <div key={payment.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium">{formatCurrency(payment.amount)}</span>
                              <span className="text-gray-600 ml-2">via {payment.method}</span>
                              {payment.reference && (
                                <span className="text-gray-500 ml-2 text-xs">({payment.reference})</span>
                              )}
                            </div>
                            <span className="text-gray-500 text-xs">
                              {new Date(payment.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No payment transactions yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Empty State */}
      {!loading && invoices.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices Yet</h3>
            <p className="text-gray-600">
              You don't have any invoices yet. They will appear here once services are completed.
            </p>
          </CardBody>
        </Card>
      )}

      <PdfViewerModal open={viewerOpen} onClose={() => setViewerOpen(false)} url={viewerUrl} title={viewerTitle} />
      </div>
    </div>
  );
}
