'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

const TEMPLATES = [
  { id: 'iso45001', name: 'ISO 45001 OH&S Audit', type: 'INTERNAL', items: 42, desc: 'Occupational health & safety management system audit checklist.' },
  { id: 'iso14001', name: 'ISO 14001 Environmental Audit', type: 'INTERNAL', items: 38, desc: 'Environmental management system compliance checklist.' },
  { id: 'iso9001', name: 'ISO 9001 Quality Audit', type: 'INTERNAL', items: 35, desc: 'Quality management system audit checklist.' },
  { id: 'site', name: 'Site Safety Inspection', type: 'INSPECTION', items: 25, desc: 'General site walk-down safety inspection.' },
  { id: 'ppe', name: 'PPE Compliance Inspection', type: 'INSPECTION', items: 12, desc: 'Personal protective equipment compliance check.' },
  { id: 'external', name: 'External Certification Audit', type: 'EXTERNAL', items: 50, desc: 'Third-party certification body audit template.' },
];

export default function AuditTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Templates"
        description="Standardised checklists used to create audits and inspections"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.name}</CardTitle>
                <Badge className="border-slate-200 bg-slate-100 text-slate-700">{t.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <p className="text-xs text-muted-foreground">{t.items} checklist items</p>
              <Link href={`/audits/new?template=${t.id}`}>
                <Button size="sm" variant="outline">Use Template</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
