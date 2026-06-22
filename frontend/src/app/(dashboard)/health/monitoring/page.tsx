'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Field } from '@/components/shared/Field';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select,
} from '@/components/ui';
import { useList, useCreate } from '@/hooks/useResource';
import { fmtDateTime } from '@/lib/format';
import type { HealthMonitoring } from '@/types';

const TYPES = ['HEAT_STRESS', 'NOISE', 'DUST', 'CHEMICAL', 'ERGONOMICS'];
const UNITS: Record<string, string> = { HEAT_STRESS: '°C WBGT', NOISE: 'dB(A)', DUST: 'mg/m³', CHEMICAL: 'ppm', ERGONOMICS: 'score' };

export default function MonitoringPage() {
  const { data, isLoading, error } = useList<HealthMonitoring>('/health/monitoring', { limit: 100 });
  const create = useCreate<HealthMonitoring>('/health/monitoring');
  const [form, setForm] = useState({ monitoring_type: 'HEAT_STRESS', reading_value: '', unit: '°C WBGT', threshold_limit: '', location: '', status: 'NORMAL' });

  const submit = () => {
    if (!form.reading_value) return;
    const value = Number(form.reading_value);
    const threshold = form.threshold_limit ? Number(form.threshold_limit) : undefined;
    let status = 'NORMAL';
    if (threshold != null) {
      if (value >= threshold) status = 'CRITICAL';
      else if (value >= threshold * 0.85) status = 'WARNING';
    }
    create.mutate(
      { ...form, reading_value: value, threshold_limit: threshold, status, recorded_at: new Date().toISOString() },
      { onSuccess: () => setForm({ ...form, reading_value: '' }) }
    );
  };

  const columns: Column<HealthMonitoring>[] = [
    { key: 'monitoring_type', header: 'Type', sortable: true, render: (r) => r.monitoring_type?.replace(/_/g, ' ') },
    { key: 'reading_value', header: 'Reading', render: (r) => `${r.reading_value} ${r.unit || ''}` },
    { key: 'threshold_limit', header: 'Threshold', render: (r) => r.threshold_limit ?? '—' },
    { key: 'location', header: 'Location', render: (r) => r.location || '—' },
    { key: 'recorded_at', header: 'Recorded', sortable: true, render: (r) => fmtDateTime(r.recorded_at) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Health Monitoring" description="Heat stress, noise, dust and chemical exposure readings" />

      <Card>
        <CardHeader><CardTitle><Plus className="mr-1 inline h-4 w-4" /> New Reading</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <Select value={form.monitoring_type} onChange={(e) => setForm({ ...form, monitoring_type: e.target.value, unit: UNITS[e.target.value] || '' })}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Reading"><Input type="number" value={form.reading_value} onChange={(e) => setForm({ ...form, reading_value: e.target.value })} /></Field>
          <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
          <Field label="Threshold Limit"><Input type="number" value={form.threshold_limit} onChange={(e) => setForm({ ...form, threshold_limit: e.target.value })} /></Field>
          <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <div className="flex items-end">
            <Button onClick={submit} disabled={create.isPending || !form.reading_value}>{create.isPending ? 'Saving…' : 'Add Reading'}</Button>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} error={error} emptyTitle="No monitoring readings" />
    </div>
  );
}
