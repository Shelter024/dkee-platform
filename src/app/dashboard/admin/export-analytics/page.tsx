import React from 'react';
import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';
const ExportAnalyticsCompare = dynamic(() => import('@/components/admin/ExportAnalyticsCompare').then(mod => ({ default: mod.ExportAnalyticsCompare })), { ssr: false, loading: () => <Skeleton lines={12} /> });

async function getAnalytics(days: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/export/analytics?days=${days}`, {
    cache: 'no-store'
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ExportAnalyticsPage({ searchParams }: { searchParams?: { days?: string } }) {
  const days = Number(searchParams?.days || 30);
  const data = await getAnalytics(days) || {};

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Export Analytics</h1>
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-600">Range:</span>
        <form className="flex space-x-2" action="" method="get">
          <select name="days" defaultValue={days} className="border rounded px-2 py-1">
            {[7,30,60,90].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
          <button className="px-3 py-1 border rounded bg-white hover:bg-gray-50">Apply</button>
        </form>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Total Exports" value={data.total || 0} />
        <Stat label="Types" value={(data.typeCounts || []).length} />
        <Stat label="Top Day Count" value={(data.topDays && data.topDays[0]) ? data.topDays[0].count : 0} />
      </div>
      <ExportAnalyticsCompare initialDays={days} initialData={data} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

// Legacy Section removed; now using chart cards.
