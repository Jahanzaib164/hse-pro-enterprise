'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Field } from '@/components/shared/Field';
import {
  Badge, Button, Dialog, DialogFooter, DialogHeader, DialogTitle, Input, Select, Textarea,
} from '@/components/ui';
import { useList, useCreate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { EmergencyPlan } from '@/types';

export default function EmergencyPlansPage() {
  const { data, isLoading, error } = useList<EmergencyPlan>('/emergency/plans', { limit: 100 });
  const create = useCreate<EmergencyPlan>('/emergency/plans');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', plan_type: 'FIRE', version: '1.0', description: '', review_date: '' });

  const submit = () => {
    if (!form.title) return;
    create.mutate(
      { ...form, status: 'ACTIVE', review_date: form.review_date || undefined },
      { onSuccess: () => { setOpen(false); setForm({ title: '', plan_type: 'FIRE', version: '1.0', description: '', review_date: '' }); } }
    );
  };

  const columns: Column<EmergencyPlan>[] = [
    { key: 'title', header: 'Plan', sortable: true },
    { key: 'plan_type', header: 'Type' },
    { key: 'version', header: 'Version', render: (r) => <Badge className="border-slate-200 bg-slate-100 text-slate-700">v{r.version}</Badge> },
    { key: 'review_date', header: 'Review Due', sortable: true, render: (r) => fmtDate(r.review_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Plans"
        description="Version-controlled emergency response plans"
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Plan</Button>}
      />
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} error={error} emptyTitle="No plans yet" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader><DialogTitle>New Emergency Plan</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value })}>
              {['FIRE', 'EVACUATION', 'MEDICAL', 'SPILL', 'EARTHQUAKE', 'GENERAL'].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Version"><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></Field>
          <Field label="Review Date"><Input type="date" value={form.review_date} onChange={(e) => setForm({ ...form, review_date: e.target.value })} /></Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !form.title}>{create.isPending ? 'Saving…' : 'Create'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
