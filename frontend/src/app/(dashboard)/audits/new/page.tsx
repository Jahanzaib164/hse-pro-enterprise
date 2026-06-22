'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@/components/ui';
import { useCreate } from '@/hooks/useResource';
import type { Audit } from '@/types';

const TEMPLATES = [
  { id: 'iso45001', name: 'ISO 45001 OH&S Audit', type: 'INTERNAL' },
  { id: 'iso14001', name: 'ISO 14001 Environmental Audit', type: 'INTERNAL' },
  { id: 'iso9001', name: 'ISO 9001 Quality Audit', type: 'INTERNAL' },
  { id: 'site', name: 'Site Safety Inspection', type: 'INSPECTION' },
  { id: 'ppe', name: 'PPE Compliance Inspection', type: 'INSPECTION' },
  { id: 'external', name: 'External Certification Audit', type: 'EXTERNAL' },
];

export default function NewAuditPage() {
  const router = useRouter();
  const search = useSearchParams();
  const create = useCreate<Audit>('/audits');

  const [templateId, setTemplateId] = useState(search.get('template') || TEMPLATES[0].id);
  const [title, setTitle] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [err, setErr] = useState('');

  const template = TEMPLATES.find((t) => t.id === templateId)!;

  const submit = () => {
    if (!title.trim()) { setErr('Title is required'); return; }
    create.mutate(
      {
        title,
        audit_type: template.type,
        planned_date: plannedDate || undefined,
        status: 'PLANNED',
        max_score: 100,
      },
      { onSuccess: (c) => router.push(`/audits/${c.id}`) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Audit" description="Start a new audit or inspection from a template" />
      <Card>
        <CardHeader><CardTitle>Audit Setup</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Template" required>
            <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Audit Type">
            <Input value={template.type} readOnly />
          </Field>
          <Field label="Title" required error={err && !title ? err : undefined} className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`e.g. ${template.name} - Q3`} />
          </Field>
          <Field label="Planned Date">
            <Input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          </Field>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create Audit'}
        </Button>
      </div>
    </div>
  );
}
