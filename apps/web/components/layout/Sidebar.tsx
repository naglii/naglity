'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/api';
import {
  Truck, CalendarDays, BarChart2, Briefcase, PlusCircle,
  Users, Building2, ClipboardList, TrendingUp, History,
} from 'lucide-react';

const navByRole: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  DRIVER: [
    { href: '/driver/feed', label: 'Available Jobs', icon: Truck },
    { href: '/driver/schedule', label: 'My Schedule', icon: CalendarDays },
    { href: '/driver/history', label: 'History', icon: History },
    { href: '/driver/stats', label: 'Statistics', icon: BarChart2 },
  ],
  BUSINESS: [
    { href: '/business/jobs', label: 'My Jobs', icon: Briefcase },
    { href: '/business/jobs/new', label: 'Post a Job', icon: PlusCircle },
    { href: '/business/stats', label: 'Statistics', icon: BarChart2 },
  ],
  ADMIN: [
    { href: '/admin/drivers', label: 'Drivers', icon: Truck },
    { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
    { href: '/admin/jobs', label: 'All Jobs', icon: ClipboardList },
    { href: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
  ],
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navByRole[role];

  // If the current path is an exact nav item, only that item is active.
  // Otherwise (e.g. detail pages like /admin/drivers/abc) use startsWith so the parent stays highlighted.
  const exactMatch = items.some((i) => i.href === pathname);
  const isActive = (href: string) =>
    pathname === href || (!exactMatch && pathname.startsWith(href + '/'));

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar flex flex-col">
      <div className="h-14 flex items-center px-5 border-b">
        <span className="text-lg font-black tracking-tight flex items-baseline gap-0.5">
          <span className="italic text-primary">N</span>aglity
          <span className="text-primary text-xs font-semibold not-italic ml-0.5 mb-0.5 leading-none">●</span>
        </span>
      </div>
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
