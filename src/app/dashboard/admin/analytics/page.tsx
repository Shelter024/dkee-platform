'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DollarSign, Wrench, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrencyGHS } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics?period=${period}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period]);

  if (loading) return <div className="text-gray-600">Loading analytics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return null;

  const totalRevenue = data.revenue.reduce((sum: number, r: any) => sum + (r._sum.amountPaid || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-cyan-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Analytics Dashboard</h2>
            <p className="text-gray-600 text-lg mt-2">Business performance insights</p>
          </div>
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="px-4 py-3 border-2 border-cyan-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-medium">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-brand-navy-700">{formatCurrencyGHS(totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Services</p>
                <p className="text-2xl font-bold text-brand-navy-700">
                  {data.serviceStats.reduce((sum: number, s: any) => sum + s._count, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-2xl font-bold text-brand-navy-700">
                  {data.customerGrowth.reduce((sum: number, c: any) => sum + c._count, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-brand-red-600">{formatCurrencyGHS(data.outstandingAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Service Status Breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Service Status Breakdown</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {data.serviceStats.map((s: any) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-gray-700">{s.status}</span>
                <span className="font-semibold">{s._count}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Top Service Types</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {data.topServices.map((s: any) => (
              <div key={s.serviceType} className="flex items-center justify-between">
                <span className="text-gray-700">{s.serviceType}</span>
                <span className="font-semibold">{s._count}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Top Customers by Revenue</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {data.topCustomers.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-600">{c.email}</div>
                </div>
                <span className="font-semibold text-brand-navy-700">{formatCurrencyGHS(c.revenue)}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
