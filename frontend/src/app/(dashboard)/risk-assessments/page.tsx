'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button, Select } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { RiskAssessment } from '@/types';

const TYPES = ['HIRA', 'JSA', 'JHA', 'ENVIRONMENTAL'];
const PAGE_SIZE = 50;

export default function RiskAssessmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const { data, isLoading, error } = useList<RiskAssessment>('/risk-assessments', {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  let rows = data?.data ?? [];
  if (type) rows = rows.filter((r) => r.assessment_type === type);

  const columns: Column<RiskAssessment>[] = [
    { key: 'reference_no', header: 'Reference', sortable: true, render: (r) => <span className="font-mono text-xs">{r.reference_no}</span> },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'assessment_type', header: 'Type' },
    { key: 'department', header: 'Department' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'review_date', header: 'Review Due', sortable: true, render: (r) => fmtDate(r.review_date) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Assessments"
        description="HIRA, JSA, JHA and environmental aspect assessments"
        actions={
          <Link href="/risk-assessments/new">
            <Button><Plus className="h-4 w-4" /> New Assessment</Button>
          </Link>
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
        onRowClick={(r) => router.push(`/risk-assessments/${r.id}`)}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No risk assessments"
      />
    </div>
  );
}
