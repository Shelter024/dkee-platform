'use client';
import { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';

interface ExportButtonsProps {
  type:
    | 'services'
    | 'invoices'
    | 'customers'
    | 'vehicles'
    | 'properties'
    | 'inquiries'
    | 'emergencies'
    | 'payments'
    | 'staff'
    | 'messages';
  className?: string;
}

export function ExportButtons({ type, className = '' }: ExportButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{start?: string; end?: string}>({});
  const [error, setError] = useState<string | null>(null);
  // Column selection state
  const columnsByType: Record<string, string[]> = {
    services: ['ID','Type','Status','Customer','Created'],
    invoices: ['Number','Customer','Status','Total','Paid','DueDate'],
    customers: ['Name','Email','Phone','Created'],
    vehicles: ['ID','Make','Model','Year','LicensePlate','Customer','Created'],
    properties: ['ID','Title','Type','Status','City','Price','ListedBy','Created'],
    inquiries: ['ID','Property','Customer','Email','Phone','Message','Status','Created'],
    emergencies: ['ID','Title','User','Phone','Status','Priority','Location','ResolvedAt','Created'],
    payments: ['ID','Invoice','Customer','Amount','Method','Reference','RecordedBy','Date'],
    staff: ['Name','Email','Phone','Role','Created'],
    messages: ['ID','Subject','Sender','Recipient','IsRead','Created'],
  };
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columnsByType[type] || []);
  // Load column preferences from settings API
  useEffect(() => {
    const key = `export_columns_${type}`;
    fetch(`/api/settings?keys=${key}`)
      .then(res => res.json())
      .then(data => {
        const val = data?.settings?.[0]?.value;
        if (val) {
          try {
            const cols = JSON.parse(val);
            if (Array.isArray(cols) && cols.every(c => columnsByType[type].includes(c))) {
              setSelectedColumns(cols);
            }
          } catch {}
        }
      });
  }, [type]);

  // Save column preferences when changed
  useEffect(() => {
    const key = `export_columns_${type}`;
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ key, value: JSON.stringify(selectedColumns) }]),
    });
  }, [selectedColumns, type]);

  // Preset date ranges
  const presets = [
    { label: 'Today', get: () => {
      const today = new Date();
      const iso = today.toISOString().slice(0,10);
      return { start: iso, end: iso };
    }},
    { label: 'Last 7 Days', get: () => {
      const today = new Date();
      const end = today.toISOString().slice(0,10);
      const startDate = new Date(today.getTime() - 6*24*60*60*1000);
      const start = startDate.toISOString().slice(0,10);
      return { start, end };
    }},
    { label: 'Month-To-Date', get: () => {
      const today = new Date();
      const end = today.toISOString().slice(0,10);
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
      return { start, end };
    }},
    { label: 'Clear', get: () => ({}) },
  ];

  // Validate date range
  const isValidRange = !dateRange.start || !dateRange.end || dateRange.start <= dateRange.end;

  const handleDownload = async (format: 'csv' | 'pdf', stream = false) => {
    if (!isValidRange) {
      setError('Start date must be before or equal to end date.');
      return;
    }
    setError(null);
    try {
      setLoading(format);
      const params = new URLSearchParams({ type, format });
      if (stream && format === 'csv') params.set('stream','true');
      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);
      if (selectedColumns.length) params.set('columns', selectedColumns.join(','));
      const url = `/api/export?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${type}-export.${format === 'csv' ? 'csv' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      alert(`Failed to export ${type}`);
    } finally {
      setLoading(null);
    }
  };

  const handleBackground = async () => {
    if (!isValidRange) {
      setError('Start date must be before or equal to end date.');
      return;
    }
    setError(null);
    try {
      setLoading('background');
      const res = await fetch('/api/export/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          format: 'csv',
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
          columns: selectedColumns,
          stream: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to queue export');
      // If URL is ready immediately, offer to download
      if (data.url) {
        const go = confirm('Export queued and ready. Download now?');
        if (go) {
          window.location.href = data.url;
        }
      } else {
        alert('Export queued. You will be notified when ready.');
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to queue background export for ${type}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0 ${className}`}>
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={dateRange.start || ''}
          onChange={e=>setDateRange(r=>({...r,start:e.target.value}))}
          className="px-2 py-1 border rounded"
          title="Start Date"
        />
        <span className="text-sm text-gray-500">to</span>
        <input
          type="date"
          value={dateRange.end || ''}
          onChange={e=>setDateRange(r=>({...r,end:e.target.value}))}
          className="px-2 py-1 border rounded"
          title="End Date"
        />
        <div className="flex space-x-1">
          {presets.map(preset => (
            <button
              key={preset.label}
              type="button"
              className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
              onClick={()=>setDateRange(preset.get())}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-700">Columns:</span>
        {columnsByType[type]?.map(col => (
          <label key={col} className="text-xs flex items-center space-x-1">
            <input
              type="checkbox"
              checked={selectedColumns.includes(col)}
              onChange={e => {
                setSelectedColumns(sc => e.target.checked ? [...sc, col] : sc.filter(c => c !== col));
              }}
            />
            <span>{col}</span>
          </label>
        ))}
      </div>
      {!isValidRange && <span className="text-xs text-red-600">Start date must be before or equal to end date.</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={() => handleDownload('csv')}
        disabled={!!loading || !isValidRange}
        className="inline-flex items-center px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        title="Download CSV"
      >
        <Download className="w-4 h-4 mr-1" /> {loading === 'csv' ? 'Exporting…' : 'CSV'}
      </button>
      <button
        onClick={() => handleDownload('csv', true)}
        disabled={!!loading || !isValidRange}
        className="inline-flex items-center px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        title="Stream CSV (large)"
      >
        <Download className="w-4 h-4 mr-1" /> {loading === 'csv' ? 'Streaming…' : 'CSV Stream'}
      </button>
      <button
        onClick={() => handleDownload('pdf')}
        disabled={!!loading || !isValidRange}
        className="inline-flex items-center px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        title="Download PDF"
      >
        <FileText className="w-4 h-4 mr-1" /> {loading === 'pdf' ? 'Exporting…' : 'PDF'}
      </button>
      <button
        onClick={handleBackground}
        disabled={!!loading || !isValidRange}
        className="inline-flex items-center px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        title="Queue background export"
      >
        {loading === 'background' ? 'Queuing…' : 'Background'}
      </button>
    </div>
  );
}
