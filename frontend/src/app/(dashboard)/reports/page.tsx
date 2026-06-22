'use client';

import { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
} from 'recharts';
import { Download, FileBarChart } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { Button, Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui';
import api from '@/lib/api';

const ENTITIES = [
  { value: 'incidents', label: 'Incidents' },
  { value: 'observations', label: 'Observations' },
  { value: 'actions', label: 'Corrective Actions' },
  { value: 'permits', label: 'Permits' },
  { value: 'audits', label: 'Audits' },
  { value: 'training', label: 'Training Records' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'all', label: 'All Modules' },
];
const PERIODS = ['daily', 'weekly', 'monthly', 'annual'];
const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280'];

const EXT: Record<string, string> = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' };

export default function ReportsPage() {
  const [entity, setEntity] = useState('incidents');
  const [period, setPeriod] = useState('monthly');
  const [format, setFormat] = useState('pdf');
  const [breakdown, setBreakdown] = useState<{ status: string; c: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (kind: 'success' | 'error', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const runReport = async () => {
    setLoading(true);
    try {
      const target = entity === 'all' ? 'incidents' : entity;
      const { data } = await api.get(`/reports/summary/${target}`);
      setBreakdown(data.breakdown);
    } catch {
      showToast('error', 'Failed to load report preview.');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await api.get('/reports/generate', {
        params: { type: period, module: entity, format },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hse-report-${entity}-${period}.${EXT[format] || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('success', 'Report generated and downloaded.');
    } catch {
      showToast('error', 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const chartData = (breakdown ?? []).map((b) => ({
    name: (b.status || 'UNKNOWN').replace(/_/g, ' '),
    value: b.c,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate and export HSE reports" />

      <Card>
        <CardHeader><CardTitle>Report Builder</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <Field label="Module">
            <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
              {ENTITIES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </Select>
          </Field>
          <Field label="Period">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
            </Select>
          </Field>
          <Field label="Format">
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={runReport} disabled={loading}>
              <FileBarChart className="h-4 w-4" /> {loading ? 'Loading…' : 'Preview'}
            </Button>
            <Button onClick={generateReport} disabled={generating}>
              <Download className="h-4 w-4" /> {generating ? 'Generating…' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {toast && (
        <p className={`text-sm ${toast.kind === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {toast.msg}
        </p>
      )}

      {breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>{ENTITIES.find((e) => e.value === entity)?.label} by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data for this module.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
