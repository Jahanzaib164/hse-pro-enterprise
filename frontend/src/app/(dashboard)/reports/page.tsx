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
  { value: 'corrective_actions', label: 'Corrective Actions' },
  { value: 'permits', label: 'Permits' },
  { value: 'audits', label: 'Audits' },
  { value: 'training_records', label: 'Training Records' },
];
const PERIODS = ['daily', 'weekly', 'monthly', 'annual'];
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280'];

export default function ReportsPage() {
  const [entity, setEntity] = useState('incidents');
  const [period, setPeriod] = useState('monthly');
  const [format, setFormat] = useState('csv');
  const [breakdown, setBreakdown] = useState<{ status: string; c: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runReport = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/reports/summary/${entity}`);
      setBreakdown(data.breakdown);
    } catch {
      setError('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const res = await api.get(`/reports/export/${entity}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}-${period}.${format === 'csv' ? 'csv' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed.');
    }
  };

  const chartData = (breakdown ?? []).map((b) => ({ name: (b.status || 'UNKNOWN').replace(/_/g, ' '), value: b.c }));

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
              <option value="csv">CSV / Excel</option>
              <option value="pdf">PDF</option>
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button onClick={runReport} disabled={loading}>
              <FileBarChart className="h-4 w-4" /> {loading ? 'Running…' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {breakdown && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{ENTITIES.find((e) => e.value === entity)?.label} by Status</CardTitle>
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
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
