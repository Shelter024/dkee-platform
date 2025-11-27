'use client';
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

interface AnalyticsData {
  typeCounts: { type: string; count: number }[];
  daily: Record<string, number>;
  topDays: { day: string; count: number }[];
  since: string;
  total: number;
}

export function ExportAnalyticsCharts({ data }: { data: Partial<AnalyticsData> }) {
  const dailyArray = Object.entries(data.daily || {})
    .sort((a,b) => a[0].localeCompare(b[0]))
    .map(([day,count]) => ({ day, count }));
  const typeArray = (data.typeCounts || []).map(t => ({ type: t.type, count: t.count }));

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Daily Export Activity">
          {dailyArray.length === 0 ? <Empty label="No data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyArray} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} minTickGap={20} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip cursor={{ stroke: '#ccc' }} />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Exports by Type">
          {typeArray.length === 0 ? <Empty label="No data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeArray} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
      <ChartCard title="Top Days">
        <div className="flex flex-wrap gap-4">
          {(data.topDays || []).map(d => (
            <div key={d.day} className="px-3 py-2 rounded border bg-white shadow-sm text-sm">
              <div className="font-mono text-xs text-gray-600">{d.day}</div>
              <div className="font-semibold">{d.count}</div>
            </div>
          ))}
          {(data.topDays || []).length === 0 && <Empty label="No data" />}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <h3 className="text-sm font-medium mb-3 text-gray-700 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="text-xs text-gray-500 italic">{label}</div>;
}
