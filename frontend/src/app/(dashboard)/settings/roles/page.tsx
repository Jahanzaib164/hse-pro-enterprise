'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

const ROLES = [
  { name: 'System Owner', key: 'system_owner', desc: 'Full control of the platform and organization settings.', perms: ['All modules', 'User management', 'System configuration', 'Billing'] },
  { name: 'Admin', key: 'admin', desc: 'Administers users, roles and most modules.', perms: ['All modules', 'User management', 'Reports'] },
  { name: 'Safety Officer', key: 'safety_officer', desc: 'Manages HSE operations and investigations.', perms: ['Incidents', 'Observations', 'Risk', 'Audits', 'Permits', 'Actions'] },
  { name: 'Supervisor', key: 'supervisor', desc: 'Oversees field activities and approvals.', perms: ['Permits (approve)', 'Observations', 'Actions (assigned)'] },
  { name: 'Worker', key: 'worker', desc: 'Reports incidents and observations.', perms: ['Report incidents', 'Report observations', 'View training'] },
  { name: 'Auditor', key: 'auditor', desc: 'Conducts audits and inspections.', perms: ['Audits', 'Findings', 'Documents (read)'] },
  { name: 'Contractor', key: 'contractor', desc: 'Limited access for external contractors.', perms: ['Permits (request)', 'Documents (assigned)'] },
];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Role Management" description="System roles and their permission scopes" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((r) => (
          <Card key={r.key}>
            <CardHeader>
              <CardTitle className="text-base">{r.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{r.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {r.perms.map((p) => (
                  <Badge key={p} className="border-blue-200 bg-blue-50 text-blue-700">{p}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
