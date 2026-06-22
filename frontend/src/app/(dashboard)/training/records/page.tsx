'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge, Button } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate, daysUntil } from '@/lib/format';
import type { TrainingRecord } from '@/types';

const PAGE_SIZE = 50;

function expiryBadge(record: TrainingRecord) {
  const d = daysUntil(record.expiry_date);
  if (d == null) return <span className="text-muted-foreground">—</span>;
  if (d < 0) return <Badge className="border-red-200 bg-red-100 text-red-800">Expired</Badge>;
  if (d < 30) return <Badge className="border-orange-200 bg-orange-100 text-orange-800">{d}d left</Badge>;
  return <Badge className="border-green-200 bg-green-100 text-green-800">Valid</Badge>;
}

export default function TrainingRecordsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useList<TrainingRecord>('/training/records', {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const columns: Column<TrainingRecord>[] = [
    { key: 'training_provider', header: 'Provider', sortable: true, render: (r) => r.training_provider || '—' },
    { key: 'instructor', header: 'Instructor', render: (r) => r.instructor || '—' },
    { key: 'completion_date', header: 'Completed', sortable: true, render: (r) => fmtDate(r.completion_date) },
    { key: 'expiry_date', header: 'Expiry', sortable: true, render: (r) => fmtDate(r.expiry_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'expiry', header: 'Validity', render: expiryBadge },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Records"
        description="All training completions with expiry status"
        actions={<Link href="/training/records/new"><Button><Plus className="h-4 w-4" /> New Record</Button></Link>}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        error={error}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No training records"
      />
    </div>
  );
}
