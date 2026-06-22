'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Field } from '@/components/shared/Field';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea,
} from '@/components/ui';
import { useList, useCreate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { EnvironmentalReading } from '@/types';

const TYPES = ['WASTE', 'WATER', 'FUEL', 'ELECTRICITY', 'EMISSIONS', 'NOISE', 'AIR_QUALITY'];
const UNITS: Record<string, string> = { WATER: 'm³', FUEL: 'L', ELECTRICITY: 'kWh', EMISSIONS: 'kg CO₂e', WASTE: 'kg', NOISE: 'dB', AIR_QUALITY: 'µg/m³' };

export default function ReadingsPage() {
  const { data, isLoading, error } = useList<EnvironmentalReading>('/environmental/readings', { limit: 100 });
  const create = useCreate<EnvironmentalReading>('/environmental/readings');
  const [form, setForm] = useState({ reading_type: 'ELECTRICITY', value: '', unit: 'kWh', reading_date: '', reading_source: '', notes: '' });

  const submit = () => {
    if (!form.value || !form.reading_date) return;
    create.mutate(
      { ...form, value: Number(form.value), unit: form.unit || UNITS[form.reading_type] },
      { onSuccess: () => setForm({ ...form, value: '', notes: '' }) }
    );
  };

  const columns: Column<EnvironmentalReading>[] = [
    { key: 'reading_type', header: 'Type', sortable: true, render: (r) => r.reading_type?.replace(/_/g, ' ') },
    { key: 'value', header: 'Value', render: (r) => `${r.value} ${r.unit || ''}` },
    { key: 'reading_date', header: 'Date', sortable: true, render: (r) => fmtDate(r.reading_date) },
    { key: 'reading_source', header: 'Source', render: (r) => r.reading_source || '—' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Environmental Readings" description="Record consumption and emission readings" />

      <Card>
        <CardHeader><CardTitle><Plus className="mr-1 inline h-4 w-4" /> New Reading</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <Select
              value={form.reading_type}
              onChange={(e) => setForm({ ...form, reading_type: e.target.value, unit: UNITS[e.target.value] || '' })}
            >
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Value"><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
          <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
          <Field label="Reading Date"><Input type="date" value={form.reading_date} onChange={(e) => setForm({ ...form, reading_date: e.target.value })} /></Field>
          <Field label="Source"><Input value={form.reading_source} onChange={(e) => setForm({ ...form, reading_source: e.target.value })} placeholder="Meter / invoice" /></Field>
          <Field label="Notes"><Textarea rows={1} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="sm:col-span-3">
            <Button onClick={submit} disabled={create.isPending || !form.value || !form.reading_date}>
              {create.isPending ? 'Saving…' : 'Add Reading'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} error={error} emptyTitle="No readings" />
    </div>
  );
}
