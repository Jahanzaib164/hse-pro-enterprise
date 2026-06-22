'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from '@/components/ui';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number | undefined;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  error,
  searchPlaceholder = 'Search…',
  searchValue,
  onSearchChange,
  onRowClick,
  // server pagination
  total,
  page,
  pageSize = 50,
  onPageChange,
  emptyTitle,
}: {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: unknown;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onRowClick?: (row: T) => void;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
}) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  // client-side search only applies when no controlled search handler is given
  const [localSearch, setLocalSearch] = React.useState('');
  const clientSearch = onSearchChange ? '' : localSearch;

  const filtered = React.useMemo(() => {
    let rows = data;
    if (clientSearch) {
      const q = clientSearch.toLowerCase();
      rows = rows.filter((r) =>
        columns.some((c) => {
          const v = c.accessor ? c.accessor(r) : (r as Record<string, unknown>)[c.key];
          return v != null && String(v).toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      rows = [...rows].sort((a, b) => {
        const av = col?.accessor ? col.accessor(a) : (a as Record<string, unknown>)[sortKey];
        const bv = col?.accessor ? col.accessor(b) : (b as Record<string, unknown>)[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, clientSearch, sortKey, sortDir, columns]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const totalPages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const currentPage = page ?? 1;

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={searchPlaceholder}
          value={onSearchChange ? searchValue ?? '' : localSearch}
          onChange={(e) => (onSearchChange ? onSearchChange(e.target.value) : setLocalSearch(e.target.value))}
        />
      </div>

      <div className="rounded-lg border">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">
            Failed to load data. Please try again.
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={emptyTitle || 'No records found'} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {c.header}
                        {sortKey === c.key &&
                          (sortDir === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      {c.render
                        ? c.render(row)
                        : String((row as Record<string, unknown>)[c.key] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total != null && onPageChange && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} record{total === 1 ? '' : 's'} · Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
