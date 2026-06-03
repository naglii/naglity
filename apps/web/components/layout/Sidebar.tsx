'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/api';
import { Logo } from './Logo';
import {
  Truck, CalendarDays, BarChart2, Briefcase, PlusCircle,
  Building2, ClipboardList, TrendingUp, History, LifeBuoy,
} from 'lucide-react';

const navByRole: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  DRIVER: [
    { href: '/driver/feed', label: 'עבודות זמינות', icon: Truck },
    { href: '/driver/schedule', label: 'לוח זמנים', icon: CalendarDays },
    { href: '/driver/history', label: 'היסטוריה', icon: History },
    { href: '/driver/stats', label: 'סטטיסטיקות', icon: BarChart2 },
  ],
  BUSINESS: [
    { href: '/business/jobs', label: 'העבודות שלי', icon: Briefcase },
    { href: '/business/jobs/new', label: 'פרסם עבודה', icon: PlusCircle },
    { href: '/business/stats', label: 'סטטיסטיקות', icon: BarChart2 },
  ],
  ADMIN: [
    { href: '/admin/drivers', label: 'נהגים', icon: Truck },
    { href: '/admin/businesses', label: 'עסקים', icon: Building2 },
    { href: '/admin/jobs', label: 'כל העבודות', icon: ClipboardList },
    { href: '/admin/revenue', label: 'הכנסות', icon: TrendingUp },
  ],
};

interface Props {
  role: Role;
  onClose?: () => void;
}

export function Sidebar({ role, onClose }: Props) {
  const pathname = usePathname();
  const items = navByRole[role];

  const exactMatch = items.some((i) => i.href === pathname);
  const isActive = (href: string) =>
    pathname === href || (!exactMatch && pathname.startsWith(href + '/'));

  return (
    <aside className="w-60 shrink-0 border-l bg-sidebar flex flex-col h-full">
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        <Link href={`/${role.toLowerCase()}`} onClick={onClose} aria-label="Naglity">
          <Logo markClassName="size-9" wordClassName="text-lg" />
        </Link>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          תפריט
        </p>
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-brand/30'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <span
                className={cn(
                  'icon-chip size-7 transition-colors',
                  active
                    ? 'bg-white/20 text-sidebar-primary-foreground'
                    : 'bg-sidebar-accent text-muted-foreground group-hover:bg-white/70 group-hover:text-foreground dark:group-hover:bg-white/10',
                )}
              >
                <Icon className="size-4 shrink-0" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <a
          href="tel:*1234"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <span className="icon-chip size-7 bg-sidebar-accent text-muted-foreground">
            <LifeBuoy className="size-4" />
          </span>
          תמיכה ועזרה
        </a>
      </div>
    </aside>
  );
}
