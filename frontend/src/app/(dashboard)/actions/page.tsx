'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Select, Badge } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate, isOverdue } from '@/lib/format';
import type { CorrectiveAction } from '@/types';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CLOSED', 'OVERDUE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PAGE_SIZE = 50;

export default function ActionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const { data, isLoading, error } = useList<CorrectiveAction>('/corrective-actions', {
    status,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  let rows = data?.data ?? [];
  if (priority) rows = rows.filter((r) => r.priority === priority);

  const columns: Column<CorrectiveAction>[] = [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'action_type', header: 'Type', render: (r) => r.action_type || 'CORRECTIVE' },
    { key: 'priority', header: 'Priority', render: (r) => <StatusBadge value={r.priority} /> },
    {
      key: 'due_date',
      header: 'Due',
      sortable: true,
      render: (r) =>
        isOverdue(r.due_date, r.status) ? (
          <Badge className="border-red-200 bg-red-100 text-red-800">Overdue {fmtDate(r.due_date)}</Badge>
        ) : (
          fmtDate(r.due_date)
        ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Corrective & Preventive Actions" description="CAPA tracking with overdue highlighting" />
      <div className="flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="max-w-[200px]">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="max-w-[200px]">
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        error={error}
        onRowClick={(r) => router.push(`/actions/${r.id}`)}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No actions found"
      />
    </div>
  );
}
