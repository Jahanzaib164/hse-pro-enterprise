'use client';

import { use, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Field';
import { FileUpload } from '@/components/shared/FileUpload';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Select, Textarea,
} from '@/components/ui';
import { useItem, useUpdate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { CorrectiveAction } from '@/types';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CLOSED', 'OVERDUE'];

export default function ActionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: action, isLoading } = useItem<CorrectiveAction>('/corrective-actions', id);
  const update = useUpdate<CorrectiveAction>('/corrective-actions');
  const [verifyNote, setVerifyNote] = useState('');

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  if (!action) return <p className="text-sm text-muted-foreground">Action not found.</p>;

  const setStatus = (status: string) => {
    const payload: Record<string, unknown> = { status };
    if (status === 'COMPLETED') payload.completed_date = new Date().toISOString().slice(0, 10);
    if (status === 'VERIFIED') payload.verified_date = new Date().toISOString().slice(0, 10);
    update.mutate({ id, payload });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={action.title} description={action.action_type || 'CORRECTIVE'} />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <StatusBadge value={action.status} />
          <StatusBadge value={action.priority} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={action.status} onChange={(e) => setStatus(e.target.value)} className="w-48">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label="Priority">{action.priority}</DetailRow>
            <DetailRow label="Source">{action.source_type || '—'}</DetailRow>
            <DetailRow label="Due date">{fmtDate(action.due_date)}</DetailRow>
            <DetailRow label="Completed">{fmtDate(action.completed_date)}</DetailRow>
            <DetailRow label="Verified">{fmtDate(action.verified_date)}</DetailRow>
            <div className="pt-3">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{action.description || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Verification & Evidence</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={3}
              placeholder="Verification notes…"
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
            />
            <FileUpload label="Upload evidence of completion" />
            <Button
              onClick={() =>
                update.mutate({
                  id,
                  payload: { status: 'VERIFIED', verified_date: new Date().toISOString().slice(0, 10) },
                })
              }
              disabled={update.isPending}
            >
              Mark Verified
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
