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
import type { Contractor } from '@/types';

const PREQUAL = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const PAGE_SIZE = 50;

export default function ContractorsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [prequal, setPrequal] = useState('');
  const { data, isLoading, error } = useList<Contractor>('/contractors', {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  let rows = data?.data ?? [];
  if (prequal) rows = rows.filter((r) => r.prequalification_status === prequal);

  const columns: Column<Contractor>[] = [
    { key: 'company_name', header: 'Company', sortable: true },
    { key: 'contact_person', header: 'Contact', render: (r) => r.contact_person || '—' },
    { key: 'contractor_type', header: 'Type', render: (r) => r.contractor_type || '—' },
    { key: 'risk_category', header: 'Risk', render: (r) => <StatusBadge value={r.risk_category} /> },
    { key: 'prequalification_status', header: 'Prequalification', render: (r) => <StatusBadge value={r.prequalification_status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractor Management"
        description="Contractor register and prequalification status"
        actions={<Link href="/contractors/new"><Button><Plus className="h-4 w-4" /> Register Contractor</Button></Link>}
      />
      <Select value={prequal} onChange={(e) => setPrequal(e.target.value)} className="max-w-[220px]">
        <option value="">All Prequalification</option>
        {PREQUAL.map((p) => <option key={p} value={p}>{p}</option>)}
      </Select>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        error={error}
        onRowClick={(r) => router.push(`/contractors/${r.id}`)}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No contractors registered"
      />
    </div>
  );
}
