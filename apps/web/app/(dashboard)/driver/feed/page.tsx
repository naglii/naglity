'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job, PayoutAccountStatus } from '@/types/api';
import { initSocket } from '@/hooks/useSocket';
import { JobCard } from '@/components/jobs/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAPACITY_BUCKETS } from '@/lib/jobAttributes';
import { Truck, Radio, Search, X, Landmark, ArrowLeft } from 'lucide-react';

const FEED_KEY = ['driver-feed'];

const bySchedule = (a: Job, b: Job) =>
  new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();

const SORT_OPTIONS = [
  { value: 'date', label: 'הקרוב ביותר' },
  { value: 'price', label: 'תשלום גבוה' },
];
const CAPACITY_ITEMS = CAPACITY_BUCKETS.map((b) => ({ value: b.key, label: b.label }));

export default function DriverFeedPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [capacity, setCapacity] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [sort, setSort] = useState('date');

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: FEED_KEY,
    queryFn: () => api.get('/drivers/me/feed').then((r) => r.data),
  });

  const { data: account } = useQuery<PayoutAccountStatus>({
    queryKey: ['payout-account'],
    queryFn: () => api.get('/drivers/me/payout-account').then((r) => r.data),
  });
  const needsPayout = account && !account.payoutsEnabled;

  useEffect(() => {
    const socket = initSocket();
    const onNew = ({ job }: { job: Job }) =>
      qc.setQueryData<Job[]>(FEED_KEY, (old = []) => [...old, job].sort(bySchedule));
    const onAccepted = ({ jobId }: { jobId: string }) =>
      qc.setQueryData<Job[]>(FEED_KEY, (old = []) => old.filter((j) => j.id !== jobId));
    socket.on('job:new', onNew);
    socket.on('job:accepted', onAccepted);
    return () => {
      socket.off('job:new', onNew);
      socket.off('job:accepted', onAccepted);
    };
  }, [qc]);

  const handleAccept = async (jobId: string) => {
    qc.setQueryData<Job[]>(FEED_KEY, (old = []) => old.filter((j) => j.id !== jobId));
    try {
      await api.post(`/jobs/${jobId}/accept`);
      toast.success('העבודה התקבלה!');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'לא ניתן לקבל את העבודה');
      qc.invalidateQueries({ queryKey: FEED_KEY });
    }
  };

  const filtered = useMemo(() => {
    let list = jobs;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((j) =>
        [j.title, j.fromLocation, j.toLocation].some((s) => s?.toLowerCase().includes(q)),
      );
    }
    if (capacity !== 'all') {
      const bucket = CAPACITY_BUCKETS.find((b) => b.key === capacity);
      if (bucket) list = list.filter((j) => bucket.test(j.craneCapacityTons));
    }
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      list = list.filter((j) => new Date(j.scheduledAt) >= from);
    }
    return [...list].sort((a, b) =>
      sort === 'price' ? b.netPriceCents - a.netPriceCents : bySchedule(a, b),
    );
  }, [jobs, search, capacity, fromDate, sort]);

  const hasFilters = !!search || capacity !== 'all' || !!fromDate || sort !== 'date';
  const clearFilters = () => { setSearch(''); setCapacity('all'); setFromDate(''); setSort('date'); };

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="icon-chip size-16 bg-accent text-brand-strong">
          <Truck className="size-7" />
        </span>
        <p className="mt-4 text-xl font-semibold">אין עבודות פתוחות כרגע</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Radio className="size-3.5 live-dot" />
          עבודות חדשות יופיעו כאן בזמן אמת
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needsPayout && (
        <Link
          href="/driver/payouts"
          className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft/50 p-3.5 transition-colors hover:bg-warning-soft"
        >
          <span className="icon-chip size-9 shrink-0 bg-warning-soft text-warning"><Landmark className="size-4.5" /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-warning">הגדר אמצעי לקבלת תשלום</p>
            <p className="text-xs text-muted-foreground">חובה להגדיר חשבון לקבלת כספים כדי לקבל עבודות</p>
          </div>
          <ArrowLeft className="size-4 shrink-0 text-warning" />
        </Link>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">עבודות זמינות</h1>
          <p className="text-sm text-muted-foreground">בחר עבודה וקבל אותה בלחיצה אחת</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
          <span className="live-dot size-2 rounded-full bg-success" />
          {filtered.length} פתוחות
        </span>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 start-2.5 text-muted-foreground" />
          <Input
            className="h-9 ps-8"
            placeholder="חיפוש לפי אזור או כותרת"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={capacity} onValueChange={(v) => setCapacity(v ?? 'all')} items={CAPACITY_ITEMS}>
          <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CAPACITY_BUCKETS.map((b) => <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input
          className="h-9 w-[150px]"
          type="date"
          title="החל מתאריך"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <Select value={sort} onValueChange={(v) => setSort(v ?? 'date')} items={SORT_OPTIONS}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={clearFilters}>
            <X className="size-3.5" /> נקה
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="icon-chip size-14 bg-accent text-brand-strong">
            <Search className="size-6" />
          </span>
          <p className="mt-3 font-semibold">אין עבודות שתואמות את הסינון</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>נקה סינון</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onAccepted={handleAccept} />
          ))}
        </div>
      )}
    </div>
  );
}
