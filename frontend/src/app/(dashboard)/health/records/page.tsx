'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Field } from '@/components/shared/Field';
import {
  Button, Dialog, DialogFooter, DialogHeader, DialogTitle, Input, Select, Textarea,
} from '@/components/ui';
import { useList, useCreate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { MedicalRecord } from '@/types';

const RECORD_TYPES = ['PRE_EMPLOYMENT', 'PERIODIC', 'FITNESS_FOR_DUTY', 'POST_INCIDENT', 'EXIT'];
const FITNESS = ['FIT', 'FIT_WITH_RESTRICTIONS', 'UNFIT', 'PENDING'];

export default function MedicalRecordsPage() {
  const { data, isLoading, error } = useList<MedicalRecord>('/health/medical', { limit: 100 });
  const create = useCreate<MedicalRecord>('/health/medical');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ record_type: 'PERIODIC', examination_date: '', examining_physician: '', facility: '', fitness_status: 'FIT', restrictions: '', next_exam_date: '', notes: '' });

  const submit = () => {
    if (!form.examination_date) return;
    create.mutate(
      { ...form, next_exam_date: form.next_exam_date || undefined },
      { onSuccess: () => { setOpen(false); setForm({ ...form, examination_date: '', notes: '' }); } }
    );
  };

  const columns: Column<MedicalRecord>[] = [
    { key: 'record_type', header: 'Type', sortable: true, render: (r) => r.record_type?.replace(/_/g, ' ') },
    { key: 'examination_date', header: 'Exam Date', sortable: true, render: (r) => fmtDate(r.examination_date) },
    { key: 'examining_physician', header: 'Physician', render: (r) => r.examining_physician || '—' },
    { key: 'fitness_status', header: 'Fitness', render: (r) => <StatusBadge value={r.fitness_status} /> },
    { key: 'next_exam_date', header: 'Next Exam', render: (r) => fmtDate(r.next_exam_date) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Surveillance"
        description="Employee medical examination records"
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Record</Button>}
      />
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} error={error} emptyTitle="No medical records" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader><DialogTitle>New Medical Record</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Record Type">
            <Select value={form.record_type} onChange={(e) => setForm({ ...form, record_type: e.target.value })}>
              {RECORD_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Fitness Status">
            <Select value={form.fitness_status} onChange={(e) => setForm({ ...form, fitness_status: e.target.value })}>
              {FITNESS.map((f) => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Exam Date" required><Input type="date" value={form.examination_date} onChange={(e) => setForm({ ...form, examination_date: e.target.value })} /></Field>
          <Field label="Next Exam Date"><Input type="date" value={form.next_exam_date} onChange={(e) => setForm({ ...form, next_exam_date: e.target.value })} /></Field>
          <Field label="Physician"><Input value={form.examining_physician} onChange={(e) => setForm({ ...form, examining_physician: e.target.value })} /></Field>
          <Field label="Facility"><Input value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })} /></Field>
          <Field label="Restrictions" className="sm:col-span-2"><Input value={form.restrictions} onChange={(e) => setForm({ ...form, restrictions: e.target.value })} /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !form.examination_date}>{create.isPending ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
