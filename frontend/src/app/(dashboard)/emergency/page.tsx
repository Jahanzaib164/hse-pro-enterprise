'use client';

import Link from 'next/link';
import { Siren, FileText, Phone, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { EmergencyPlan, EmergencyContact, EmergencyDrill } from '@/types';

export default function EmergencyPage() {
  const { data: plans } = useList<EmergencyPlan>('/emergency/plans', { limit: 100 });
  const { data: contacts } = useList<EmergencyContact>('/emergency/contacts', { limit: 100 });
  const { data: drills } = useList<EmergencyDrill>('/emergency/drills', { limit: 100 });

  const stats = [
    { label: 'Emergency Plans', value: plans?.total ?? 0, icon: FileText },
    { label: 'Contacts', value: contacts?.total ?? 0, icon: Phone },
    { label: 'Drills Conducted', value: (drills?.data ?? []).filter((d) => d.status === 'COMPLETED').length, icon: Siren },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Management"
        description="Plans, contacts and drill readiness"
        actions={
          <div className="flex gap-2">
            <Link href="/emergency/plans"><Button variant="outline"><FileText className="h-4 w-4" /> Plans</Button></Link>
            <Link href="/emergency/drills"><Button variant="outline"><Siren className="h-4 w-4" /> Drills</Button></Link>
            <Link href="/emergency/drills/new"><Button><Plus className="h-4 w-4" /> Schedule Drill</Button></Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Emergency Contacts</CardTitle></CardHeader>
          <CardContent>
            {(contacts?.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts configured.</p>
            ) : (
              <ul className="divide-y">
                {(contacts?.data ?? []).map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.role}</p>
                    </div>
                    <span className="text-sm">{c.phone_primary}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Drills</CardTitle></CardHeader>
          <CardContent>
            {(drills?.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No drills recorded.</p>
            ) : (
              <ul className="divide-y">
                {(drills?.data ?? []).slice(0, 6).map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{d.drill_type?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(d.actual_date || d.scheduled_date)}</p>
                    </div>
                    <StatusBadge value={d.status} />
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
