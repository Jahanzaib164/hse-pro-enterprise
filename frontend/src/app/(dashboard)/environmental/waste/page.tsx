'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Field } from '@/components/shared/Field';
import {
  Button, Dialog, DialogFooter, DialogHeader, DialogTitle, Input, Select,
} from '@/components/ui';
import { useList, useCreate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { WasteRecord } from '@/types';

const CATEGORIES = ['HAZARDOUS', 'NON_HAZARDOUS', 'RECYCLABLE', 'ORGANIC'];

export default function WasteLogPage() {
  const { data, isLoading, error } = useList<WasteRecord>('/environmental/waste', { limit: 100 });
  const create = useCreate<WasteRecord>('/environmental/waste');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ waste_type: '', waste_category: 'NON_HAZARDOUS', quantity: '', unit: 'kg', disposal_method: '', disposal_company: '', manifest_number: '', disposal_date: '' });

  const submit = () => {
    if (!form.waste_type || !form.quantity) return;
    create.mutate(
      { ...form, quantity: Number(form.quantity), disposal_date: form.disposal_date || undefined },
      { onSuccess: () => { setOpen(false); setForm({ ...form, waste_type: '', quantity: '' }); } }
    );
  };

  const columns: Column<WasteRecord>[] = [
    { key: 'waste_type', header: 'Waste', sortable: true },
    { key: 'waste_category', header: 'Category', render: (r) => <StatusBadge value={r.waste_category} /> },
    { key: 'quantity', header: 'Qty', render: (r) => `${r.quantity} ${r.unit || ''}` },
    { key: 'disposal_method', header: 'Disposal', render: (r) => r.disposal_method || '—' },
    { key: 'disposal_company', header: 'Company', render: (r) => r.disposal_company || '—' },
    { key: 'disposal_date', header: 'Date', sortable: true, render: (r) => fmtDate(r.disposal_date) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste Log"
        description="Track waste generation and disposal"
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Log Waste</Button>}
      />
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} error={error} emptyTitle="No waste records" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader><DialogTitle>Log Waste</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Waste Type" required><Input value={form.waste_type} onChange={(e) => setForm({ ...form, waste_type: e.target.value })} /></Field>
          <Field label="Category">
            <Select value={form.waste_category} onChange={(e) => setForm({ ...form, waste_category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Quantity" required><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
          <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
          <Field label="Disposal Method"><Input value={form.disposal_method} onChange={(e) => setForm({ ...form, disposal_method: e.target.value })} /></Field>
          <Field label="Disposal Company"><Input value={form.disposal_company} onChange={(e) => setForm({ ...form, disposal_company: e.target.value })} /></Field>
          <Field label="Manifest No."><Input value={form.manifest_number} onChange={(e) => setForm({ ...form, manifest_number: e.target.value })} /></Field>
          <Field label="Disposal Date"><Input type="date" value={form.disposal_date} onChange={(e) => setForm({ ...form, disposal_date: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !form.waste_type || !form.quantity}>{create.isPending ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
