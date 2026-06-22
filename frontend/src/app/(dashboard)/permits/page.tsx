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
import { fmtDateTime } from '@/lib/format';
import type { Permit } from '@/types';

const STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'EXPIRED', 'REJECTED'];
const PAGE_SIZE = 50;

export default function PermitsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useList<Permit>('/permits', {
    status,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const columns: Column<Permit>[] = [
    { key: 'permit_number', header: 'Permit No.', sortable: true, render: (r) => <span className="font-mono text-xs">{r.permit_number}</span> },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'permit_type', header: 'Type', render: (r) => r.permit_type?.replace(/_/g, ' ') },
    { key: 'risk_level', header: 'Risk', render: (r) => <StatusBadge value={r.risk_level} /> },
    { key: 'start_datetime', header: 'Start', sortable: true, render: (r) => fmtDateTime(r.start_datetime) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permit to Work"
        description="Manage hot work, confined space, work-at-height and other permits"
        actions={
          <Link href="/permits/new"><Button><Plus className="h-4 w-4" /> New Permit</Button></Link>
        }
      />
      <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="max-w-[220px]">
        <option value="">All Statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
      </Select>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        error={error}
        onRowClick={(r) => router.push(`/permits/${r.id}`)}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No permits found"
      />
    </div>
  );
}
