'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Field } from '@/components/shared/Field';
import {
  Badge, Button, Dialog, DialogFooter, DialogHeader, DialogTitle, Input, Select,
} from '@/components/ui';
import { useList, useCreate } from '@/hooks/useResource';
import type { TrainingCourse } from '@/types';

export default function CoursesPage() {
  const { data, isLoading, error } = useList<TrainingCourse>('/training/courses', { limit: 100 });
  const create = useCreate<TrainingCourse>('/training/courses');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', category: '', duration_hours: '', validity_months: '', competency_level: 'BASIC', is_mandatory: false });

  const submit = () => {
    if (!form.name) return;
    create.mutate(
      {
        name: form.name,
        code: form.code || undefined,
        category: form.category || undefined,
        duration_hours: form.duration_hours ? Number(form.duration_hours) : undefined,
        validity_months: form.validity_months ? Number(form.validity_months) : undefined,
        competency_level: form.competency_level,
        is_mandatory: form.is_mandatory,
      },
      { onSuccess: () => { setOpen(false); setForm({ name: '', code: '', category: '', duration_hours: '', validity_months: '', competency_level: 'BASIC', is_mandatory: false }); } }
    );
  };

  const columns: Column<TrainingCourse>[] = [
    { key: 'name', header: 'Course', sortable: true },
    { key: 'code', header: 'Code', render: (r) => r.code || '—' },
    { key: 'category', header: 'Category', render: (r) => r.category || '—' },
    { key: 'duration_hours', header: 'Hours', render: (r) => r.duration_hours ?? '—' },
    { key: 'validity_months', header: 'Validity (mo)', render: (r) => r.validity_months ?? '—' },
    { key: 'is_mandatory', header: 'Mandatory', render: (r) => (r.is_mandatory ? <Badge className="border-blue-200 bg-blue-100 text-blue-800">Mandatory</Badge> : '—') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Library"
        description="Available training courses"
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Course</Button>}
      />
      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} error={error} emptyTitle="No courses yet" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader><DialogTitle>Add Course</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Duration (hours)"><Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} /></Field>
          <Field label="Validity (months)"><Input type="number" value={form.validity_months} onChange={(e) => setForm({ ...form, validity_months: e.target.value })} /></Field>
          <Field label="Competency Level">
            <Select value={form.competency_level} onChange={(e) => setForm({ ...form, competency_level: e.target.value })}>
              {['AWARENESS', 'BASIC', 'INTERMEDIATE', 'ADVANCED'].map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_mandatory} onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })} />
            Mandatory course
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !form.name}>{create.isPending ? 'Saving…' : 'Add'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
