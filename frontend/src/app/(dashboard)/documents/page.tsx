'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge, Button, Select } from '@/components/ui';
import { useList } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { DocumentRecord } from '@/types';

const ISO = ['ISO_9001', 'ISO_14001', 'ISO_45001', 'NONE'];
const DOC_TYPES = ['POLICY', 'PROCEDURE', 'WORK_INSTRUCTION', 'FORM', 'RECORD', 'MANUAL'];
const STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'SUPERSEDED', 'OBSOLETE'];
const PAGE_SIZE = 50;

export default function DocumentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [iso, setIso] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useList<DocumentRecord>('/documents', {
    status,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  let rows = data?.data ?? [];
  if (iso) rows = rows.filter((r) => r.iso_standard === iso);
  if (type) rows = rows.filter((r) => r.document_type === type);

  const columns: Column<DocumentRecord>[] = [
    { key: 'document_number', header: 'Doc No.', sortable: true, render: (r) => <span className="font-mono text-xs">{r.document_number || '—'}</span> },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'document_type', header: 'Type', render: (r) => r.document_type?.replace(/_/g, ' ') },
    { key: 'iso_standard', header: 'ISO', render: (r) => (r.iso_standard && r.iso_standard !== 'NONE' ? <Badge className="border-indigo-200 bg-indigo-100 text-indigo-800">{r.iso_standard.replace('_', ' ')}</Badge> : '—') },
    { key: 'version', header: 'Version', render: (r) => `v${r.version || '1.0'}` },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'review_date', header: 'Review', sortable: true, render: (r) => fmtDate(r.review_date) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Control"
        description="Integrated management system document library"
        actions={<Link href="/documents/new"><Button><Plus className="h-4 w-4" /> Upload Document</Button></Link>}
      />
      <div className="flex flex-wrap gap-3">
        <Select value={iso} onChange={(e) => setIso(e.target.value)} className="max-w-[180px]">
          <option value="">All ISO Standards</option>
          {ISO.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="max-w-[180px]">
          <option value="">All Types</option>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="max-w-[180px]">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        error={error}
        onRowClick={(r) => router.push(`/documents/${r.id}`)}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No documents"
      />
    </div>
  );
}
