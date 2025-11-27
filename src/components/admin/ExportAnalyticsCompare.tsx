'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { ExportAnalyticsCharts } from './ExportAnalyticsCharts';

interface AnalyticsData {
  typeCounts: { type: string; count: number }[];
  daily: Record<string, number>;
  topDays: { day: string; count: number }[];
  since: string;
  total: number;
  days?: number;
}

async function fetchAnalytics(days: number): Promise<AnalyticsData | null> {
  const res = await fetch(`/api/export/analytics?days=${days}`);
  if (!res.ok) return null;
  return res.json();
}

export function ExportAnalyticsCompare({ initialDays, initialData }: { initialDays: number; initialData: AnalyticsData | any }) {
  const [days, setDays] = useState(initialDays);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<AnalyticsData | null>(initialData);
  const [previous, setPrevious] = useState<AnalyticsData | null>(null);
  const [compare, setCompare] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number, doCompare: boolean) => {
    setLoading(true); setError(null);
    try {
      const cur = await fetchAnalytics(d);
      setCurrent(cur);
      if (doCompare) {
        const prev = await fetchAnalytics(d);
        setPrevious(prev);
      } else {
        setPrevious(null);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days, compare); }, [days, compare, load]);

  const buildCsv = () => {
    if (!current) return;
    const rows: string[] = [];
    const esc = (s: string) => '"' + s.replace(/"/g,'""') + '"';
    const prevTotal = previous?.total || 0;
    const deltaTotal = current.total - prevTotal;
    const deltaPctTotal = prevTotal ? (deltaTotal/prevTotal)*100 : 100;
    rows.push('Section,Metric,Current,Previous,Delta,DeltaPct');
    rows.push(['Summary','TotalExports',current.total,prevTotal,deltaTotal,deltaPctTotal.toFixed(1)+'%'].map(String).map(esc).join(','));
    rows.push(['Summary','Types',current.typeCounts.length,previous?.typeCounts.length || 0,(current.typeCounts.length - (previous?.typeCounts.length||0)),(previous?.typeCounts.length?(((current.typeCounts.length - previous.typeCounts.length)/previous.typeCounts.length)*100).toFixed(1)+'%':'100%')].map(String).map(esc).join(','));
    // Type counts
    const prevTypeMap: Record<string, number> = {};
    previous?.typeCounts.forEach(t => { prevTypeMap[t.type] = t.count; });
    current.typeCounts.forEach(t => {
      const prev = prevTypeMap[t.type] || 0;
      const delta = t.count - prev;
      const pct = prev ? (delta/prev)*100 : 100;
      rows.push(['Type',t.type,t.count,prev,delta,pct.toFixed(1)+'%'].map(String).map(esc).join(','));
    });
    // Daily counts (align days present in current)
    const prevDaily = previous?.daily || {};
    Object.entries(current.daily || {}).sort().forEach(([day,count]) => {
      const prev = prevDaily[day] || 0;
      const delta = count - prev;
      const pct = prev ? (delta/prev)*100 : 100;
      rows.push(['Daily',day,count,prev,delta,pct.toFixed(1)+'%'].map(String).map(esc).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `export-analytics-${days}d${compare?'-compare':''}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm flex items-center gap-2">Range
          <select value={days} onChange={e=>setDays(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
            {[7,30,60,90].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)} /> Compare previous period
        </label>
        <button
          onClick={buildCsv}
          disabled={!current || loading}
          className="px-3 py-1 text-sm border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
        >Download CSV Summary</button>
        {loading && <span className="text-xs text-gray-500">Loading…</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      <ExportAnalyticsCharts data={current || {}} />
      {compare && previous && current && (
        <div className="mt-4 p-4 border rounded bg-white shadow-sm">
          <h3 className="text-sm font-medium mb-3 uppercase tracking-wide text-gray-600">Comparison Overview</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <DeltaCard label="Total Exports" current={current.total} prev={previous.total} />
            <DeltaCard label="Types" current={current.typeCounts.length} prev={previous.typeCounts.length} />
            <DeltaCard label="Top Day Count" current={(current.topDays[0]?.count)||0} prev={(previous.topDays[0]?.count)||0} />
          </div>
        </div>
      )}
    </div>
  );
}

function DeltaCard({ label, current, prev }: { label: string; current: number; prev: number }) {
  const delta = current - prev;
  const pct = prev ? (delta/prev)*100 : 100;
  const color = delta === 0 ? 'text-gray-600' : delta > 0 ? 'text-green-600' : 'text-red-600';
  return (
    <div className="p-3 border rounded bg-gray-50">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-semibold">{current}</span>
        <span className={`text-xs ${color}`}>{delta>0?'+':''}{delta} ({pct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}
