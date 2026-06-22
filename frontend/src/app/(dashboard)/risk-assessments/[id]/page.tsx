'use client';

import { use } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Field';
import { RiskMatrix } from '@/components/shared/RiskMatrix';
import { Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui';
import { useItem, useUpdate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { RiskAssessment } from '@/types';

const STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'SUPERSEDED'];

export default function RiskAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: ra, isLoading } = useItem<RiskAssessment>('/risk-assessments', id);
  const update = useUpdate<RiskAssessment>('/risk-assessments');

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  if (!ra) return <p className="text-sm text-muted-foreground">Risk assessment not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={ra.title} description={`${ra.reference_no} · ${ra.assessment_type}`} />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <StatusBadge value={ra.status} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={ra.status}
              onChange={(e) => update.mutate({ id, payload: { status: e.target.value } })}
              className="w-48"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label="Reference">{ra.reference_no}</DetailRow>
            <DetailRow label="Type">{ra.assessment_type}</DetailRow>
            <DetailRow label="Department">{ra.department || '—'}</DetailRow>
            <DetailRow label="Activity">{ra.activity || '—'}</DetailRow>
            <DetailRow label="Review date">{fmtDate(ra.review_date)}</DetailRow>
            <DetailRow label="Created">{fmtDate(ra.created_at)}</DetailRow>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Risk Matrix</CardTitle></CardHeader>
          <CardContent>
            <RiskMatrix />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Hazards & Controls</CardTitle></CardHeader>
        <CardContent>
          {ra.description ? (
            <ul className="space-y-2">
              {ra.description.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="rounded-md border px-3 py-2 text-sm">{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No hazards recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
