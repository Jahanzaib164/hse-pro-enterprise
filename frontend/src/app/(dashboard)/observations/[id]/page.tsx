'use client';

import { use, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Field';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea,
} from '@/components/ui';
import { useItem, useUpdate, useCreate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { Observation, CorrectiveAction } from '@/types';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

export default function ObservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: obs, isLoading } = useItem<Observation>('/observations', id);
  const update = useUpdate<Observation>('/observations');
  const createAction = useCreate<CorrectiveAction>('/corrective-actions');

  const [actionTitle, setActionTitle] = useState('');
  const [actionDue, setActionDue] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [created, setCreated] = useState(false);

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  if (!obs) return <p className="text-sm text-muted-foreground">Observation not found.</p>;

  const assign = () => {
    if (!actionTitle) return;
    createAction.mutate(
      {
        source_type: 'OBSERVATION',
        source_id: id,
        title: actionTitle,
        description: actionDesc,
        action_type: 'CORRECTIVE',
        priority: obs.risk_rating || 'MEDIUM',
        status: 'OPEN',
        due_date: actionDue || undefined,
      },
      {
        onSuccess: () => {
          setCreated(true);
          setActionTitle('');
          setActionDesc('');
          setActionDue('');
          update.mutate({ id, payload: { status: 'IN_PROGRESS' } });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={obs.title}
        description={`${obs.reference_no} · ${obs.observation_type?.replace(/_/g, ' ')}`}
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <StatusBadge value={obs.status} />
          <StatusBadge value={obs.risk_rating} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={obs.status}
              onChange={(e) => update.mutate({ id, payload: { status: e.target.value } })}
              className="w-48"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label="Reference">{obs.reference_no}</DetailRow>
            <DetailRow label="Type">{obs.observation_type?.replace(/_/g, ' ')}</DetailRow>
            <DetailRow label="Date">{fmtDate(obs.observation_date)}</DetailRow>
            <DetailRow label="Location">{obs.location || '—'}</DetailRow>
            <DetailRow label="GPS">{obs.gps_lat ? `${obs.gps_lat}, ${obs.gps_lng}` : '—'}</DetailRow>
            <DetailRow label="Closed">{fmtDate(obs.closed_date)}</DetailRow>
            <div className="pt-3">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{obs.description || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assign Corrective Action</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {created && <p className="text-sm text-green-600">Action created and linked.</p>}
            <Input placeholder="Action title" value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} />
            <Textarea placeholder="What needs to be done?" rows={3} value={actionDesc} onChange={(e) => setActionDesc(e.target.value)} />
            <Input type="date" value={actionDue} onChange={(e) => setActionDue(e.target.value)} />
            <Button onClick={assign} disabled={createAction.isPending || !actionTitle}>
              {createAction.isPending ? 'Creating…' : 'Create Action'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
