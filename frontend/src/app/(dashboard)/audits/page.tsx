'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, LayoutTemplate } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button, Select } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { Audit } from '@/types';

const TYPES = ['INTERNAL', 'EXTERNAL', 'INSPECTION'];
const PAGE_SIZE = 50;

export default function AuditsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const { data, isLoading, error } = useList<Audit>('/audits', {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  let rows = data?.data ?? [];
  if (type) rows = rows.filter((r) => r.audit_type === type);

  const columns: Column<Audit>[] = [
    { key: 'reference_no', header: 'Reference', sortable: true, render: (r) => <span className="font-mono text-xs">{r.reference_no}</span> },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'audit_type', header: 'Type' },
    { key: 'planned_date', header: 'Planned', sortable: true, render: (r) => fmtDate(r.planned_date) },
    { key: 'compliance_percentage', header: 'Compliance', render: (r) => (r.compliance_percentage != null ? `${r.compliance_percentage}%` : '—') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audits & Inspections"
        description="Plan, conduct and track audits, inspections and findings"
        actions={
          <div className="flex gap-2">
            <Link href="/audits/templates"><Button variant="outline"><LayoutTemplate className="h-4 w-4" /> Templates</Button></Link>
            <Link href="/audits/new"><Button><Plus className="h-4 w-4" /> New Audit</Button></Link>
          </div>
        }
      />
      <Select value={type} onChange={(e) => setType(e.target.value)} className="max-w-[200px]">
        <option value="">All Types</option>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </Select>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        error={error}
        onRowClick={(r) => router.push(`/audits/${r.id}`)}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No audits scheduled"
      />
    </div>
  );
}
