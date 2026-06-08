'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Business } from '@/types/api';
import { CreateBusinessForm, type Prefill } from '@/components/admin/CreateBusinessForm';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface BusinessWithUser extends Business { user: { username: string; email?: string | null } }

export default function AdminBusinessesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | undefined>();
  const [typeFilter, setTypeFilter] = useState<'all' | 'BUSINESS' | 'INDIVIDUAL'>('all');

  // Opened from a signup request? Pull the prefilled details and open the form.
  useEffect(() => {
    const raw = sessionStorage.getItem('prefill-business');
    if (raw) {
      try { setPrefill(JSON.parse(raw)); } catch { /* ignore */ }
      sessionStorage.removeItem('prefill-business');
      setOpen(true);
    }
  }, []);

  const { data, isLoading } = useQuery<BusinessWithUser[]>({
    queryKey: ['admin-businesses'],
    queryFn: () => api.get('/admin/businesses').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/businesses/${id}`),
    onSuccess: () => { toast.success('העסק נמחק'); qc.invalidateQueries({ queryKey: ['admin-businesses'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">לקוחות ועסקים</h1>
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} חשבונות רשומים</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button size="lg" className="gap-1.5 font-semibold" />}>
            <PlusCircle className="size-4" />עסק חדש
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader className="px-6"><SheetTitle>יצירת עסק</SheetTitle></SheetHeader>
            <div className="px-6 pb-8">
              <CreateBusinessForm prefill={prefill} onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['admin-businesses'] }); }} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {([['all', 'הכל'], ['BUSINESS', 'עסקים'], ['INDIVIDUAL', 'לקוחות']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${typeFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">שם</TableHead>
                <TableHead className="font-semibold">סוג</TableHead>
                <TableHead className="font-semibold">שם משתמש</TableHead>
                <TableHead className="font-semibold">טלפון</TableHead>
                <TableHead className="font-semibold">הצטרף</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? [])
                .filter((b) => typeFilter === 'all' || (b.accountType ?? 'BUSINESS') === typeFilter)
                .map((b) => (
                <TableRow key={b.id} className="transition-colors hover:bg-accent/40">
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <span className="bg-brand-gradient grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white select-none">
                        {b.name.trim().charAt(0) || '?'}
                      </span>
                      {b.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${(b.accountType ?? 'BUSINESS') === 'INDIVIDUAL' ? 'bg-info-soft text-info' : 'bg-brand-soft text-brand-strong'}`}>
                      {(b.accountType ?? 'BUSINESS') === 'INDIVIDUAL' ? 'לקוח' : 'עסק'}
                    </span>
                  </TableCell>
                  <TableCell>{b.user.username}</TableCell>
                  <TableCell>{b.phone}</TableCell>
                  <TableCell>{format(new Date(b.createdAt), 'dd/MM/yy')}</TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/admin/businesses/${b.id}`} />}>
                      <ExternalLink className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm('למחוק את העסק?')) deleteMutation.mutate(b.id);
                    }}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
