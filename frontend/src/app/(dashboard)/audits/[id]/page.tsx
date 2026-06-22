'use client';

import { use, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Field';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui';
import { useItem, useUpdate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { Audit } from '@/types';

const STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];

interface ChecklistItem {
  id: string;
  text: string;
  result: 'PASS' | 'FAIL' | 'NA' | '';
}
interface Finding {
  id: string;
  type: string;
  description: string;
}

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: audit, isLoading } = useItem<Audit>('/audits', id);
  const update = useUpdate<Audit>('/audits');

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', text: 'Documented HSE policy is available and communicated', result: '' },
    { id: '2', text: 'Risk assessments are current and accessible', result: '' },
    { id: '3', text: 'PPE is provided and used correctly', result: '' },
    { id: '4', text: 'Emergency procedures are in place and tested', result: '' },
    { id: '5', text: 'Incident reporting process is followed', result: '' },
  ]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findText, setFindText] = useState('');
  const [findType, setFindType] = useState('MINOR_NC');

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  if (!audit) return <p className="text-sm text-muted-foreground">Audit not found.</p>;

  const answered = checklist.filter((c) => c.result && c.result !== 'NA');
  const passed = checklist.filter((c) => c.result === 'PASS');
  const compliance = answered.length ? Math.round((passed.length / answered.length) * 100) : 0;

  const saveScore = () => {
    update.mutate({
      id,
      payload: { compliance_percentage: compliance, score: passed.length, max_score: answered.length, findings_count: findings.length },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={audit.title} description={`${audit.reference_no} · ${audit.audit_type}`} />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <StatusBadge value={audit.status} />
          <Badge>{compliance}% compliant</Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={audit.status}
              onChange={(e) => update.mutate({ id, payload: { status: e.target.value } })}
              className="w-48"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="findings">Findings & NCRs ({findings.length})</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <Card>
            <CardHeader><CardTitle>Audit Checklist</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {checklist.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
                  <span className="text-sm">{c.text}</span>
                  <Select
                    value={c.result}
                    onChange={(e) =>
                      setChecklist(checklist.map((x) => (x.id === c.id ? { ...x, result: e.target.value as ChecklistItem['result'] } : x)))
                    }
                    className="w-28"
                  >
                    <option value="">—</option>
                    <option value="PASS">Pass</option>
                    <option value="FAIL">Fail</option>
                    <option value="NA">N/A</option>
                  </Select>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">Compliance score: {compliance}%</span>
                <Button onClick={saveScore} disabled={update.isPending}>Save Score</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <Card>
            <CardHeader><CardTitle>Findings & NCR Tracking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Select value={findType} onChange={(e) => setFindType(e.target.value)} className="w-44">
                  {['MAJOR_NC', 'MINOR_NC', 'OBSERVATION', 'POSITIVE'].map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </Select>
                <Input
                  className="flex-1"
                  placeholder="Describe finding…"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (!findText) return;
                    setFindings([...findings, { id: crypto.randomUUID(), type: findType, description: findText }]);
                    setFindText('');
                  }}
                >
                  Add
                </Button>
              </div>
              {findings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No findings recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {findings.map((f) => (
                    <li key={f.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm">{f.description}</span>
                      <StatusBadge value={f.type.includes('NC') ? 'OPEN' : f.type} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <DetailRow label="Reference">{audit.reference_no}</DetailRow>
              <DetailRow label="Type">{audit.audit_type}</DetailRow>
              <DetailRow label="Planned date">{fmtDate(audit.planned_date)}</DetailRow>
              <DetailRow label="Actual date">{fmtDate(audit.actual_date)}</DetailRow>
              <DetailRow label="Compliance">{audit.compliance_percentage != null ? `${audit.compliance_percentage}%` : '—'}</DetailRow>
              <DetailRow label="Findings">{audit.findings_count ?? 0}</DetailRow>
              <DetailRow label="NCRs">{audit.ncr_count ?? 0}</DetailRow>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
