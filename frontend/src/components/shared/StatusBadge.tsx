import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

const COLORS: Record<string, string> = {
  // generic statuses
  OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
  REPORTED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
  UNDER_INVESTIGATION: 'bg-amber-100 text-amber-800 border-amber-200',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800 border-amber-200',
  ASSIGNED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PLANNED: 'bg-slate-100 text-slate-800 border-slate-200',
  DRAFT: 'bg-slate-100 text-slate-800 border-slate-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  VERIFIED: 'bg-green-100 text-green-800 border-green-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  VALID: 'bg-green-100 text-green-800 border-green-200',
  FIT: 'bg-green-100 text-green-800 border-green-200',
  NORMAL: 'bg-green-100 text-green-800 border-green-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
  SUPERSEDED: 'bg-gray-100 text-gray-700 border-gray-200',
  OBSOLETE: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  UNFIT: 'bg-red-100 text-red-800 border-red-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  WARNING: 'bg-amber-100 text-amber-800 border-amber-200',
  HAZARDOUS: 'bg-red-100 text-red-800 border-red-200',
  NON_HAZARDOUS: 'bg-green-100 text-green-800 border-green-200',
  RECYCLABLE: 'bg-blue-100 text-blue-800 border-blue-200',
  ORGANIC: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CONDITIONAL: 'bg-amber-100 text-amber-800 border-amber-200',
  FIT_WITH_RESTRICTIONS: 'bg-amber-100 text-amber-800 border-amber-200',
  // severity / risk
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
};

export function StatusBadge({ value, className }: { value?: string; className?: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const key = value.toUpperCase();
  return (
    <Badge className={cn(COLORS[key] || 'bg-slate-100 text-slate-800 border-slate-200', className)}>
      {value.replace(/_/g, ' ')}
    </Badge>
  );
}
