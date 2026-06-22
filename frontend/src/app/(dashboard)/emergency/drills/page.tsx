'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { EmergencyDrill } from '@/types';

const PAGE_SIZE = 50;

export default function DrillsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useList<EmergencyDrill>('/emergency/drills', {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const columns: Column<EmergencyDrill>[] = [
    { key: 'drill_type', header: 'Type', sortable: true, render: (r) => r.drill_type?.replace(/_/g, ' ') },
    { key: 'scheduled_date', header: 'Scheduled', sortable: true, render: (r) => fmtDate(r.scheduled_date) },
    { key: 'actual_date', header: 'Conducted', render: (r) => fmtDate(r.actual_date) },
    { key: 'participants_count', header: 'Participants', render: (r) => r.participants_count ?? '—' },
    { key: 'duration_minutes', header: 'Duration (min)', render: (r) => r.duration_minutes ?? '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drill Records"
        description="Emergency drill schedule and outcomes"
        actions={<Link href="/emergency/drills/new"><Button><Plus className="h-4 w-4" /> Schedule Drill</Button></Link>}
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
        emptyTitle="No drills recorded"
      />
    </div>
  );
}
