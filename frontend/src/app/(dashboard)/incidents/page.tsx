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
import type { Incident } from '@/types';

const TYPES = ['INCIDENT', 'NEAR_MISS', 'OBSERVATION', 'PROPERTY_DAMAGE', 'VEHICLE', 'ENVIRONMENTAL'];
const STATUSES = ['REPORTED', 'UNDER_INVESTIGATION', 'ASSIGNED', 'VERIFIED', 'CLOSED'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PAGE_SIZE = 50;

export default function IncidentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');

  const { data, isLoading, error } = useList<Incident>('/incidents', {
    status,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  // type/severity filtered client-side (backend list supports status filter only)
  let rows = data?.data ?? [];
  if (type) rows = rows.filter((r) => r.incident_type === type);
  if (severity) rows = rows.filter((r) => r.severity === severity);

  const columns: Column<Incident>[] = [
    {
      key: 'reference_no',
      header: 'Reference',
      sortable: true,
      render: (r) => <span className="font-mono text-xs">{r.reference_no}</span>,
    },
    { key: 'title', header: 'Title', sortable: true },
    {
      key: 'incident_type',
      header: 'Type',
      render: (r) => r.incident_type?.replace(/_/g, ' '),
    },
    { key: 'severity', header: 'Severity', render: (r) => <StatusBadge value={r.severity} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'incident_date', header: 'Date', sortable: true, render: (r) => fmtDate(r.incident_date) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Management"
        description="Report, track and investigate incidents and near misses"
        actions={
          <Link href="/incidents/new">
            <Button>
              <Plus className="h-4 w-4" /> Report Incident
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={type} onChange={(e) => setType(e.target.value)} className="max-w-[200px]">
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="max-w-[200px]">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} className="max-w-[200px]">
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        error={error}
        onRowClick={(r) => router.push(`/incidents/${r.id}`)}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No incidents reported"
      />
    </div>
  );
}
