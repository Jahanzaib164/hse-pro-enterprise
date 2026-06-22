'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { RiskMatrix, riskLevel, riskScoreColor } from '@/components/shared/RiskMatrix';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui';
import { useCreate } from '@/hooks/useResource';
import { cn } from '@/lib/utils';
import type { RiskAssessment } from '@/types';

interface HazardRow {
  id: string;
  hazard: string;
  control: string;
  likelihood: number;
  severity: number;
}

export default function NewRiskAssessmentPage() {
  const router = useRouter();
  const create = useCreate<RiskAssessment>('/risk-assessments');

  const [title, setTitle] = useState('');
  const [assessmentType, setAssessmentType] = useState('HIRA');
  const [activity, setActivity] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<HazardRow[]>([
    { id: crypto.randomUUID(), hazard: '', control: '', likelihood: 3, severity: 3 },
  ]);
  const [active, setActive] = useState(0);
  const [err, setErr] = useState('');

  const updateRow = (i: number, patch: Partial<HazardRow>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = () => {
    if (!title.trim()) { setErr('Title is required'); return; }
    create.mutate(
      {
        title,
        assessment_type: assessmentType,
        activity,
        department,
        description: [description, ...rows.filter((r) => r.hazard).map(
          (r) => `Hazard: ${r.hazard} | Control: ${r.control} | Risk: ${r.likelihood * r.severity} (${riskLevel(r.likelihood * r.severity)})`
        )].filter(Boolean).join('\n'),
        status: 'DRAFT',
      },
      { onSuccess: (c) => router.push(`/risk-assessments/${c.id}`) }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Risk Assessment" description="Identify hazards and assess residual risk" />

      <Card>
        <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required error={err && !title ? err : undefined} className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Assessment Type" required>
            <Select value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)}>
              {['HIRA', 'JSA', 'JHA', 'ENVIRONMENTAL'].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Department">
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </Field>
          <Field label="Activity / Task" className="sm:col-span-2">
            <Input value={activity} onChange={(e) => setActivity(e.target.value)} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hazards & Controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hazard</TableHead>
                <TableHead>Control Measure</TableHead>
                <TableHead>L</TableHead>
                <TableHead>S</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const score = r.likelihood * r.severity;
                return (
                  <TableRow key={r.id} className={cn(active === i && 'bg-muted/40')} onClick={() => setActive(i)}>
                    <TableCell><Input value={r.hazard} onChange={(e) => updateRow(i, { hazard: e.target.value })} placeholder="Hazard" /></TableCell>
                    <TableCell><Input value={r.control} onChange={(e) => updateRow(i, { control: e.target.value })} placeholder="Control" /></TableCell>
                    <TableCell>
                      <Select value={r.likelihood} onChange={(e) => updateRow(i, { likelihood: Number(e.target.value) })} className="w-16">
                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={r.severity} onChange={(e) => updateRow(i, { severity: Number(e.target.value) })} className="w-16">
                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className={cn('rounded px-2 py-1 text-xs font-semibold', riskScoreColor(score))}>
                        {score} {riskLevel(score)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRows([...rows, { id: crypto.randomUUID(), hazard: '', control: '', likelihood: 3, severity: 3 }])}
          >
            <Plus className="h-4 w-4" /> Add Hazard
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>5×5 Risk Matrix</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Click a cell to set likelihood × severity for the selected hazard row.
          </p>
          <RiskMatrix
            likelihood={rows[active]?.likelihood}
            severity={rows[active]?.severity}
            onSelect={(v) => updateRow(active, { likelihood: v.likelihood, severity: v.severity })}
          />
        </CardContent>
      </Card>

      {create.isError && <p className="text-sm text-red-600">Failed to save. Please try again.</p>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Save Assessment'}
        </Button>
      </div>
    </div>
  );
}
