'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Field';
import {
  Button, Card, CardContent, CardHeader, CardTitle, Select,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui';
import { useItem, useUpdate } from '@/hooks/useResource';
import { useList } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { Incident, CorrectiveAction } from '@/types';

const WORKFLOW = ['REPORTED', 'UNDER_INVESTIGATION', 'ASSIGNED', 'VERIFIED', 'CLOSED'];

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: incident, isLoading } = useItem<Incident>('/incidents', id);
  const update = useUpdate<Incident>('/incidents');
  const { data: actionsResp } = useList<CorrectiveAction>('/corrective-actions');

  const actions = (actionsResp?.data ?? []).filter(
    (a) => a.source_type === 'INCIDENT' && a.source_id === id
  );

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  if (!incident) return <p className="text-sm text-muted-foreground">Incident not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={incident.title}
        description={`${incident.reference_no} · ${incident.incident_type?.replace(/_/g, ' ')}`}
        actions={
          <Link href={`/incidents/${id}/investigate`}>
            <Button variant="outline">
              <Search className="h-4 w-4" /> Investigate
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <StatusBadge value={incident.status} />
          <StatusBadge value={incident.severity} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Update status:</span>
            <Select
              value={incident.status}
              onChange={(e) => update.mutate({ id, payload: { status: e.target.value } })}
              className="w-56"
            >
              {WORKFLOW.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="actions">Corrective Actions ({actions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent>
                <DetailRow label="Reference">{incident.reference_no}</DetailRow>
                <DetailRow label="Type">{incident.incident_type?.replace(/_/g, ' ')}</DetailRow>
                <DetailRow label="Date">{fmtDate(incident.incident_date)}</DetailRow>
                <DetailRow label="Time">{incident.incident_time || '—'}</DetailRow>
                <DetailRow label="Location">{incident.location || '—'}</DetailRow>
                <DetailRow label="GPS">
                  {incident.gps_lat ? `${incident.gps_lat}, ${incident.gps_lng}` : '—'}
                </DetailRow>
                <DetailRow label="Lost time (days)">{incident.lost_time_days ?? 0}</DetailRow>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Description & People</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{incident.description || 'No description provided.'}</p>
                <DetailRow label="Injured person">{incident.injured_person_name || '—'}</DetailRow>
                <DetailRow label="Injury type">{incident.injury_type || '—'}</DetailRow>
                <DetailRow label="Body part">{incident.body_part_affected || '—'}</DetailRow>
                <DetailRow label="Treatment">{incident.treatment_provided || '—'}</DetailRow>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investigation">
          <Card>
            <CardHeader><CardTitle>Root Cause Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Root cause">{incident.root_cause || 'Not yet determined'}</DetailRow>
              <DetailRow label="Contributing factors">{incident.contributing_factors || '—'}</DetailRow>
              <Link href={`/incidents/${id}/investigate`}>
                <Button variant="outline">Open Investigation (5-Why / Fishbone)</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader><CardTitle>Corrective & Preventive Actions</CardTitle></CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions linked to this incident yet.</p>
              ) : (
                <ul className="divide-y">
                  {actions.map((a) => (
                    <li
                      key={a.id}
                      className="flex cursor-pointer items-center justify-between py-3"
                      onClick={() => router.push(`/actions/${a.id}`)}
                    >
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">Due {fmtDate(a.due_date)}</p>
                      </div>
                      <StatusBadge value={a.status} />
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
