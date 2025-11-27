'use client';

import { useEffect, useState } from 'react';
import { formatCurrencyGHS } from '@/lib/utils';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, RefreshCw } from 'lucide-react';
import { ExportButtons } from '@/components/admin/ExportButtons';

export default function AdminPaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [recording, setRecording] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const url = `/api/invoices${status ? `?status=${status}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load invoices');
      setInvoices(data.invoices || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">Partial</Badge>;
      case 'UNPAID':
        return <Badge variant="danger">Unpaid</Badge>;
      default:
        return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">Payments</h2>
            <p className="text-gray-600 text-lg mt-2">Review invoices and payment status</p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButtons type="invoices" />
            <ExportButtons type="payments" />
            <button
              onClick={load}
              className="inline-flex items-center px-4 py-3 text-sm rounded-xl border-2 border-emerald-200 hover:bg-emerald-50 font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
          </div>
        </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment Logs</h3>
            <div className="flex items-center space-x-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">All</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && invoices.length === 0 && (
            <p className="text-gray-600">No invoices found.</p>
          )}
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand-navy-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-navy-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{inv.invoiceNumber}</span>
                        {statusBadge(inv.paymentStatus)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total: {formatCurrencyGHS(inv.total || 0)} • Paid: {formatCurrencyGHS(inv.amountPaid || 0)}
                      </div>
                      {inv.transactionRef && (
                        <div className="text-xs text-gray-500">Ref: {inv.transactionRef}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>Customer: {inv.customer?.user?.name}</div>
                    <div>Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                    <button
                      onClick={() => setOpenId(openId === inv.id ? null : inv.id)}
                      className="mt-2 inline-flex items-center px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                    >
                      {openId === inv.id ? 'Hide' : 'Record Payment'}
                    </button>
                  </div>
                </div>
                {openId === inv.id && (
                  <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget as HTMLFormElement);
                        const amount = Number(fd.get('amount'));
                        const method = String(fd.get('method')) as any;
                        const reference = String(fd.get('reference') || '');
                        try {
                          setRecording(inv.id);
                          const res = await fetch('/api/payments/record', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ invoiceId: inv.id, amount, method, reference }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Failed to record');
                          await load();
                          setOpenId(null);
                        } catch (err: any) {
                          setError(err.message);
                        } finally {
                          setRecording(null);
                        }
                      }}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3"
                    >
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Amount</label>
                        <input name="amount" type="number" step="0.01" min={0}
                          className="w-full px-3 py-2 border rounded-lg" required />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Method</label>
                        <select name="method" className="w-full px-3 py-2 border rounded-lg" required>
                          <option>Card</option>
                          <option>Mobile Money</option>
                          <option>Cash</option>
                          <option>Cheque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Reference</label>
                        <input name="reference" className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-navy-600 text-white hover:bg-brand-navy-700"
                          disabled={recording === inv.id}
                        >
                          {recording === inv.id ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0">
        <CardHeader>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Gateway Setup</h3>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-brand-navy-900">
            Ensure environment variables are set in your deployment:
          </p>
          <ul className="mt-2 text-sm text-brand-navy-900 list-disc pl-5">
            <li>`PAYSTACK_SECRET_KEY`</li>
            <li>`NEXT_PUBLIC_APP_URL`</li>
            <li>`PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_APP_KEY`, `PUSHER_CLUSTER`</li>
          </ul>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
