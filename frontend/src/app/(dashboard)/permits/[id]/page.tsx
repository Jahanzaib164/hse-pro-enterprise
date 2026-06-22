'use client';

import { use, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Field';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select,
} from '@/components/ui';
import { useItem, useUpdate } from '@/hooks/useResource';
import { fmtDateTime } from '@/lib/format';
import type { Permit } from '@/types';

const STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'EXPIRED', 'REJECTED'];

const APPROVAL_CHAIN = [
  { role: 'Requester', key: 'requested' },
  { role: 'HSE Officer', key: 'reviewed' },
  { role: 'Area Authority', key: 'approved' },
  { role: 'Permit Issuer', key: 'issued' },
];

export default function PermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: permit, isLoading } = useItem<Permit>('/permits', id);
  const update = useUpdate<Permit>('/permits');
  const [signature, setSignature] = useState('');
  const [extDate, setExtDate] = useState('');
  const [extRequested, setExtRequested] = useState(false);

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  if (!permit) return <p className="text-sm text-muted-foreground">Permit not found.</p>;

  const approvedIndex = ['APPROVED', 'ACTIVE'].includes(permit.status) ? APPROVAL_CHAIN.length : permit.status === 'PENDING_APPROVAL' ? 1 : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={permit.title} description={`${permit.permit_number} · ${permit.permit_type?.replace(/_/g, ' ')}`} />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <StatusBadge value={permit.status} />
          <StatusBadge value={permit.risk_level} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={permit.status} onChange={(e) => update.mutate({ id, payload: { status: e.target.value } })} className="w-52">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Permit Details</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label="Permit No.">{permit.permit_number}</DetailRow>
            <DetailRow label="Type">{permit.permit_type?.replace(/_/g, ' ')}</DetailRow>
            <DetailRow label="Location">{permit.work_location || '—'}</DetailRow>
            <DetailRow label="Start">{fmtDateTime(permit.start_datetime)}</DetailRow>
            <DetailRow label="End">{fmtDateTime(permit.end_datetime)}</DetailRow>
            <DetailRow label="Gas test">{permit.gas_test_required ? 'Required' : 'Not required'}</DetailRow>
            <DetailRow label="PPE">{permit.ppe_required || '—'}</DetailRow>
            <div className="pt-3">
              <p className="text-sm text-muted-foreground">Precautions</p>
              <p className="text-sm">{permit.precautions || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Approval Chain</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {APPROVAL_CHAIN.map((step, i) => (
                  <li key={step.key} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < approvedIndex ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm">{step.role}</span>
                    {i < approvedIndex && <StatusBadge value="APPROVED" className="ml-auto" />}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Digital Signature</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Type your full name to sign" value={signature} onChange={(e) => setSignature(e.target.value)} />
              <Button
                disabled={!signature || update.isPending}
                onClick={() => update.mutate({ id, payload: { status: 'APPROVED' } })}
              >
                Sign & Approve
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Extension Request</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {extRequested && <p className="text-sm text-green-600">Extension requested to {extDate}.</p>}
              <Input type="datetime-local" value={extDate} onChange={(e) => setExtDate(e.target.value)} />
              <Button variant="outline" disabled={!extDate} onClick={() => setExtRequested(true)}>
                Request Extension
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
