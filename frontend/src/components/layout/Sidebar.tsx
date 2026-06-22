'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, AlertTriangle, Eye, ClipboardList, CheckSquare,
  FileSearch, FileText, GraduationCap, Siren, Leaf, HeartPulse,
  Folder, Users, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/observations', label: 'Observations', icon: Eye },
  { href: '/risk-assessments', label: 'Risk Assessments', icon: ClipboardList },
  { href: '/corrective-actions', label: 'Corrective Actions', icon: CheckSquare },
  { href: '/audits', label: 'Audits', icon: FileSearch },
  { href: '/permits', label: 'Permits To Work', icon: FileText },
  { href: '/training', label: 'Training', icon: GraduationCap },
  { href: '/emergency', label: 'Emergency', icon: Siren },
  { href: '/environmental', label: 'Environmental', icon: Leaf },
  { href: '/health', label: 'Occupational Health', icon: HeartPulse },
  { href: '/documents', label: 'Documents', icon: Folder },
  { href: '/contractors', label: 'Contractors', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <span className="font-bold">HSE Pro</span>
      </div>
      <nav className="space-y-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
