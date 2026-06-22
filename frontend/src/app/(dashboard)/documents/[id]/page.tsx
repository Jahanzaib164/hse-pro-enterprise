'use client';

import { use } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Field';
import { Button, Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui';
import { useItem, useUpdate } from '@/hooks/useResource';
import { fmtDate } from '@/lib/format';
import type { DocumentRecord } from '@/types';

const STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'SUPERSEDED', 'OBSOLETE'];

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: doc, isLoading } = useItem<DocumentRecord>('/documents', id);
  const update = useUpdate<DocumentRecord>('/documents');

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  if (!doc) return <p className="text-sm text-muted-foreground">Document not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.title}
        description={`${doc.document_number || 'No number'} · v${doc.version}`}
        actions={
          <Button variant="outline" disabled={!doc.current_file_path}>
            <Download className="h-4 w-4" /> Download
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <StatusBadge value={doc.status} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={doc.status} onChange={(e) => update.mutate({ id, payload: { status: e.target.value } })} className="w-48">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label="Document number">{doc.document_number || '—'}</DetailRow>
            <DetailRow label="Type">{doc.document_type?.replace(/_/g, ' ')}</DetailRow>
            <DetailRow label="ISO standard">{doc.iso_standard?.replace('_', ' ') || '—'}</DetailRow>
            <DetailRow label="Category">{doc.category || '—'}</DetailRow>
            <DetailRow label="Effective date">{fmtDate(doc.effective_date)}</DetailRow>
            <DetailRow label="Review date">{fmtDate(doc.review_date)}</DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Version History</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Version {doc.version}</p>
                  <p className="text-xs text-muted-foreground">Current · {fmtDate(doc.created_at)}</p>
                </div>
                <StatusBadge value={doc.status} />
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Previous versions are archived automatically when a new version is approved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
