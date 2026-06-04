'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { SignupRequest, SignupRequestType } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Inbox, Phone, Mail, Truck, Building2, UserPlus, Check, RotateCcw, Trash2, Weight } from 'lucide-react';

type Filter = 'ALL' | SignupRequestType;

export default function AdminRequestsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data: requests = [], isLoading } = useQuery<SignupRequest[]>({
    queryKey: ['admin-requests'],
    queryFn: () => api.get('/admin/requests').then((r) => r.data),
  });

  const handledMutation = useMutation({
    mutationFn: ({ id, handled }: { id: string; handled: boolean }) =>
      api.patch(`/admin/requests/${id}/handled`, { handled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-requests'] }),
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/requests/${id}`),
    onSuccess: () => { toast.success('הבקשה נמחקה'); qc.invalidateQueries({ queryKey: ['admin-requests'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const createAccount = (r: SignupRequest) => {
    const prefill = {
      name: r.type === 'BUSINESS' ? (r.businessName ?? r.name) : r.name,
      phone: r.phone,
      email: r.email ?? undefined,
      craneCapacityTons: r.craneCapacityTons ?? undefined,
      liftHeightMeters: r.liftHeightMeters ?? undefined,
    };
    if (r.type === 'DRIVER') {
      sessionStorage.setItem('prefill-driver', JSON.stringify(prefill));
      router.push('/admin/drivers');
    } else {
      sessionStorage.setItem('prefill-business', JSON.stringify(prefill));
      router.push('/admin/businesses');
    }
  };

  const byType = filter === 'ALL' ? requests : requests.filter((r) => r.type === filter);
  const newReqs = byType.filter((r) => !r.handled);
  const handledReqs = byType.filter((r) => r.handled);

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL', label: 'הכל', count: requests.length },
    { key: 'DRIVER', label: 'נהגים', count: requests.filter((r) => r.type === 'DRIVER').length },
    { key: 'BUSINESS', label: 'עסקים', count: requests.filter((r) => r.type === 'BUSINESS').length },
  ];

  const renderCard = (r: SignupRequest) => {
    const isDriver = r.type === 'DRIVER';
    return (
      <Card key={r.id} className={cn('p-0', r.handled && 'opacity-70')}>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={cn('icon-chip size-9 shrink-0', isDriver ? 'bg-info-soft text-info' : 'bg-warning-soft text-warning')}>
                {isDriver ? <Truck className="size-4.5" /> : <Building2 className="size-4.5" />}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold leading-tight">{isDriver ? r.name : (r.businessName ?? r.name)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {isDriver ? 'נהג מנוף' : 'עסק'}
                  {!isDriver && r.name ? ` · ${r.name}` : ''}
                  {' · '}
                  {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: he })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-sm">
            <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-foreground hover:text-brand-strong">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" />
              <bdi dir="ltr">{r.phone}</bdi>
            </a>
            {r.email && (
              <a href={`mailto:${r.email}`} className="flex items-center gap-2 text-foreground hover:text-brand-strong">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                <bdi dir="ltr" className="truncate">{r.email}</bdi>
              </a>
            )}
            {isDriver && (r.craneCapacityTons != null || r.liftHeightMeters != null) && (
              <div className="flex items-center gap-2 text-foreground">
                <Weight className="size-3.5 shrink-0 text-muted-foreground" />
                <span>
                  {r.craneCapacityTons != null && <>קיבולת <span className="font-semibold">{r.craneCapacityTons} טון</span></>}
                  {r.craneCapacityTons != null && r.liftHeightMeters != null && ' · '}
                  {r.liftHeightMeters != null && <>גובה <span className="font-semibold">{r.liftHeightMeters} מ׳</span></>}
                </span>
              </div>
            )}
          </div>

          {r.details && (
            <p className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground line-clamp-3">{r.details}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button size="sm" className="gap-1.5" onClick={() => createAccount(r)}>
              <UserPlus className="size-3.5" />
              צור חשבון
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handledMutation.mutate({ id: r.id, handled: !r.handled })}>
              {r.handled ? <><RotateCcw className="size-3.5" /> החזר לטיפול</> : <><Check className="size-3.5" /> סמן כטופל</>}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ms-auto text-destructive hover:text-destructive"
              onClick={() => { if (confirm('למחוק את הבקשה?')) deleteMutation.mutate(r.id); }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const SectionHeader = ({ label, count, tone }: { label: string; count: number; tone: 'new' | 'handled' }) => (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-bold">{label}</h2>
      <span className={cn(
        'rounded-full px-2 py-0.5 text-xs font-semibold',
        tone === 'new' ? 'bg-warning-soft text-warning' : 'bg-muted text-muted-foreground',
      )}>
        {count}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">בקשות הצטרפות</h1>
        <p className="text-sm text-muted-foreground">פניות מנהגים ועסקים שמעוניינים להצטרף</p>
      </div>

      {/* type filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
              filter === c.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {c.label}
            <span className={cn('text-xs', filter === c.key ? 'text-primary-foreground/80' : 'text-muted-foreground/70')}>
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="icon-chip size-16 bg-accent text-brand-strong">
            <Inbox className="size-7" />
          </span>
          <p className="mt-4 text-xl font-semibold">אין בקשות הצטרפות</p>
          <p className="mt-1 text-sm text-muted-foreground">בקשות חדשות מטופס ההרשמה יופיעו כאן</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* New requests */}
          <section className="space-y-3">
            <SectionHeader label="בקשות חדשות" count={newReqs.length} tone="new" />
            {newReqs.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">אין בקשות חדשות בקטגוריה זו.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">{newReqs.map(renderCard)}</div>
            )}
          </section>

          {/* Handled requests */}
          <section className="space-y-3">
            <SectionHeader label="בקשות שטופלו" count={handledReqs.length} tone="handled" />
            {handledReqs.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">עדיין לא טופלו בקשות בקטגוריה זו.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">{handledReqs.map(renderCard)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
