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
import type { Observation } from '@/types';

const TYPES = ['UNSAFE_ACT', 'UNSAFE_CONDITION', 'POSITIVE', 'GOOD_CATCH'];
const PAGE_SIZE = 50;

export default function ObservationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const { data, isLoading, error } = useList<Observation>('/observations', {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  let rows = data?.data ?? [];
  if (type) rows = rows.filter((r) => r.observation_type === type);

  const columns: Column<Observation>[] = [
    { key: 'reference_no', header: 'Reference', sortable: true, render: (r) => <span className="font-mono text-xs">{r.reference_no}</span> },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'observation_type', header: 'Type', render: (r) => r.observation_type?.replace(/_/g, ' ') },
    { key: 'risk_rating', header: 'Risk', render: (r) => <StatusBadge value={r.risk_rating} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'observation_date', header: 'Date', sortable: true, render: (r) => fmtDate(r.observation_date) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hazard Observations"
        description="Unsafe acts, unsafe conditions, positive observations and good catches"
        actions={
          <Link href="/observations/new">
            <Button><Plus className="h-4 w-4" /> New Observation</Button>
          </Link>
        }
      />
      <Select value={type} onChange={(e) => setType(e.target.value)} className="max-w-[220px]">
        <option value="">All Types</option>
        {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
      </Select>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        error={error}
        onRowClick={(r) => router.push(`/observations/${r.id}`)}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No observations recorded"
      />
    </div>
  );
}
