'use client';

import Link from 'next/link';
import { Stethoscope, Activity } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { MedicalRecord, HealthMonitoring } from '@/types';

export default function HealthPage() {
  const { data: medical } = useList<MedicalRecord>('/health/medical', { limit: 200 });
  const { data: monitoring } = useList<HealthMonitoring>('/health/monitoring', { limit: 200 });

  const med = medical?.data ?? [];
  const mon = monitoring?.data ?? [];
  const fit = med.filter((m) => m.fitness_status === 'FIT').length;
  const restricted = med.filter((m) => m.fitness_status === 'FIT_WITH_RESTRICTIONS').length;
  const unfit = med.filter((m) => m.fitness_status === 'UNFIT').length;
  const alerts = mon.filter((m) => m.status === 'CRITICAL' || m.status === 'WARNING').length;

  const stats = [
    { label: 'Fit for Duty', value: fit },
    { label: 'With Restrictions', value: restricted },
    { label: 'Unfit', value: unfit },
    { label: 'Monitoring Alerts', value: alerts },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Occupational Health"
        description="Medical surveillance and health monitoring overview"
        actions={
          <div className="flex gap-2">
            <Link href="/health/records"><Button variant="outline"><Stethoscope className="h-4 w-4" /> Medical Records</Button></Link>
            <Link href="/health/monitoring"><Button variant="outline"><Activity className="h-4 w-4" /> Monitoring</Button></Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Medical Records</CardTitle></CardHeader>
          <CardContent>
            {med.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records.</p>
            ) : (
              <ul className="divide-y">
                {med.slice(0, 6).map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{m.record_type?.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground">{fmtDate(m.examination_date)}</span>
                    <StatusBadge value={m.fitness_status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Monitoring</CardTitle></CardHeader>
          <CardContent>
            {mon.length === 0 ? (
              <p className="text-sm text-muted-foreground">No monitoring readings.</p>
            ) : (
              <ul className="divide-y">
                {mon.slice(0, 6).map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{m.monitoring_type?.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{m.reading_value} {m.unit}</span>
                    <StatusBadge value={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
