'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FileText, CheckCircle, AlertCircle, DollarSign, Search } from 'lucide-react';
import { formatCurrencyGHS } from '@/lib/utils';

interface ApiInvoice {
  id: string;
  invoiceNumber: string;
  description?: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  paymentStatus: string; // PAID | PARTIALLY_PAID | UNPAID | OVERDUE
  createdAt: string;
  dueDate: string;
  customer?: { id: string; user?: { id: string; name: string; email: string }; };
}

export default function AdminInvoicesListPage() {
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState<string>('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Fetch invoices
  const load = async () => {
    try {
      setLoading(true);
      const base = '/api/invoices';
      const qs: string[] = [];
      if (status) qs.push(`status=${encodeURIComponent(status)}`);
      const url = qs.length ? `${base}?${qs.join('&')}` : base;
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

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  // Derived & filtered invoices
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (customerQuery) {
        const name = inv.customer?.user?.name?.toLowerCase() || '';
        const email = inv.customer?.user?.email?.toLowerCase() || '';
        const q = customerQuery.toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      if (dateFrom) {
        const cf = new Date(dateFrom).getTime();
        if (new Date(inv.createdAt).getTime() < cf) return false;
      }
      if (dateTo) {
        const ct = new Date(dateTo).getTime();
        if (new Date(inv.createdAt).getTime() > ct) return false;
      }
      return true;
    });
  }, [invoices, customerQuery, dateFrom, dateTo]);

  // Summary metrics
  const summary = useMemo(() => {
    const paid = invoices.filter(i => i.paymentStatus === 'PAID').length;
    const unpaid = invoices.filter(i => i.paymentStatus === 'UNPAID' || i.paymentStatus === 'OVERDUE').length;
    const outstandingAmount = invoices.reduce((sum, i) => sum + Math.max(i.total - i.amountPaid, 0), 0);
    return { count: invoices.length, paid, unpaid, outstandingAmount };
  }, [invoices]);

  const paymentBadge = (s: string) => {
    switch (s) {
      case 'PAID': return <Badge variant="success">Paid</Badge>;
      case 'PARTIALLY_PAID': return <Badge variant="warning">Partial</Badge>;
      case 'UNPAID': return <Badge variant="danger">Unpaid</Badge>;
      case 'OVERDUE': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge>{ s }</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-500">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">Invoices</h1>
            <p className="text-gray-600 text-lg">Monitor billing status, payments, and outstanding balances</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="">All</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Customer</label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  placeholder="Search name or email..."
                  value={customerQuery}
                  onChange={e => setCustomerQuery(e.target.value)}
                  className="pl-9 pr-3 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm w-56"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => { setStatus(''); setCustomerQuery(''); setDateFrom(''); setDateTo(''); }}
                className="px-6 py-3 font-semibold"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-400 via-violet-500 to-fuchsia-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Total Invoices</p>
                  <p className="text-5xl font-bold">{summary.count}</p>
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
                  <p className="text-sm font-medium opacity-90 mb-1">Paid</p>
                  <p className="text-5xl font-bold">{summary.paid}</p>
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
                  <p className="text-sm font-medium opacity-90 mb-1">Unpaid / Overdue</p>
                  <p className="text-5xl font-bold">{summary.unpaid}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <AlertCircle className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Outstanding (GHS)</p>
                  <p className="text-4xl font-bold">{formatCurrencyGHS(summary.outstandingAmount)}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl">
                  <DollarSign className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Invoices List</h3>
          </CardHeader>
          <CardBody>
            {loading && <p className="text-gray-600">Loading invoices...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && filtered.length === 0 && !error && (
              <p className="text-gray-600">No invoices match current filters.</p>
            )}
            {filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Totals</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map(inv => {
                      const unpaid = Math.max(inv.total - inv.amountPaid, 0);
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium">{inv.customer?.user?.name || '—'}</div>
                            <div className="text-xs text-gray-600">{inv.customer?.user?.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">{paymentBadge(inv.paymentStatus)}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="text-gray-700">Total: {formatCurrencyGHS(inv.total)}</div>
                            <div className="text-gray-700">Paid: {formatCurrencyGHS(inv.amountPaid)}</div>
                            <div className={`text-xs ${unpaid > 0 ? 'text-red-600' : 'text-green-600'}`}>Unpaid: {formatCurrencyGHS(unpaid)}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/dashboard/admin/invoices/${inv.id}`} className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 shadow">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
