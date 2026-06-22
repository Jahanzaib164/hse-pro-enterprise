'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow, Field } from '@/components/shared/Field';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui';
import { useItem } from '@/hooks/useResource';
import api from '@/lib/api';
import { fmtDate } from '@/lib/format';
import type { Contractor, ContractorEvaluation } from '@/types';

export default function ContractorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { data: contractor, isLoading } = useItem<Contractor>('/contractors', id);

  const { data: evals } = useQuery<{ data: ContractorEvaluation[] }>({
    queryKey: ['contractor', id, 'evaluations'],
    queryFn: async () => (await api.get(`/contractors/${id}/evaluations`)).data,
  });
  const { data: docs } = useQuery<{ data: { id: string; document_type: string; status: string; expiry_date?: string }[] }>({
    queryKey: ['contractor', id, 'documents'],
    queryFn: async () => (await api.get(`/contractors/${id}/documents`)).data,
  });

  const [form, setForm] = useState({ evaluation_date: '', safety_score: '', quality_score: '', compliance_score: '', status: 'APPROVED', valid_until: '', notes: '' });

  const addEval = useMutation({
    mutationFn: async () => {
      const safety = Number(form.safety_score) || 0;
      const quality = Number(form.quality_score) || 0;
      const compliance = Number(form.compliance_score) || 0;
      const overall = Math.round((safety + quality + compliance) / 3);
      return (await api.post(`/contractors/${id}/evaluations`, {
        evaluation_date: form.evaluation_date || undefined,
        safety_score: safety,
        quality_score: quality,
        compliance_score: compliance,
        overall_score: overall,
        status: form.status,
        valid_until: form.valid_until || undefined,
        notes: form.notes,
      })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractor', id, 'evaluations'] });
      setForm({ ...form, safety_score: '', quality_score: '', compliance_score: '', notes: '' });
    },
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  if (!contractor) return <p className="text-sm text-muted-foreground">Contractor not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={contractor.company_name} description={contractor.contractor_type || 'Contractor'} />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <StatusBadge value={contractor.prequalification_status} />
          <StatusBadge value={contractor.risk_category} />
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations ({evals?.data.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({docs?.data.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
            <CardContent>
              <DetailRow label="Registration">{contractor.registration_number || '—'}</DetailRow>
              <DetailRow label="Contact">{contractor.contact_person || '—'}</DetailRow>
              <DetailRow label="Email">{contractor.email || '—'}</DetailRow>
              <DetailRow label="Phone">{contractor.phone || '—'}</DetailRow>
              <DetailRow label="Address">{contractor.address || '—'}</DetailRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Evaluation History</CardTitle></CardHeader>
              <CardContent>
                {(evals?.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evaluations yet.</p>
                ) : (
                  <ul className="divide-y">
                    {(evals?.data ?? []).map((e) => (
                      <li key={e.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">Overall {e.overall_score}%</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(e.evaluation_date)} · valid to {fmtDate(e.valid_until)}</p>
                        </div>
                        <StatusBadge value={e.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>New Evaluation</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Date"><Input type="date" value={form.evaluation_date} onChange={(e) => setForm({ ...form, evaluation_date: e.target.value })} /></Field>
                <Field label="Valid Until"><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></Field>
                <Field label="Safety (%)"><Input type="number" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} /></Field>
                <Field label="Quality (%)"><Input type="number" value={form.quality_score} onChange={(e) => setForm({ ...form, quality_score: e.target.value })} /></Field>
                <Field label="Compliance (%)"><Input type="number" value={form.compliance_score} onChange={(e) => setForm({ ...form, compliance_score: e.target.value })} /></Field>
                <Field label="Status">
                  <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {['APPROVED', 'CONDITIONAL', 'REJECTED'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="Notes" className="sm:col-span-2"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                <div className="sm:col-span-2">
                  <Button onClick={() => addEval.mutate()} disabled={addEval.isPending}>
                    {addEval.isPending ? 'Saving…' : 'Add Evaluation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle>Documents & Expiry Tracking</CardTitle></CardHeader>
            <CardContent>
              {(docs?.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <ul className="divide-y">
                  {(docs?.data ?? []).map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">{d.document_type?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">Expires {fmtDate(d.expiry_date)}</p>
                      </div>
                      <StatusBadge value={d.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
