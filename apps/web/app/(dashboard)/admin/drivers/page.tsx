'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Driver } from '@/types/api';
import { CreateDriverForm, type Prefill } from '@/components/admin/CreateDriverForm';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface DriverWithUser extends Driver { user: { username: string; email?: string | null } }

export default function AdminDriversPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | undefined>();

  // Opened from a signup request? Pull the prefilled details and open the form.
  useEffect(() => {
    const raw = sessionStorage.getItem('prefill-driver');
    if (raw) {
      try { setPrefill(JSON.parse(raw)); } catch { /* ignore */ }
      sessionStorage.removeItem('prefill-driver');
      setOpen(true);
    }
  }, []);

  const { data, isLoading } = useQuery<DriverWithUser[]>({
    queryKey: ['admin-drivers'],
    queryFn: () => api.get('/admin/drivers').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/drivers/${id}`),
    onSuccess: () => { toast.success('הנהג נמחק'); qc.invalidateQueries({ queryKey: ['admin-drivers'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">נהגים</h1>
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} נהגים רשומים</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button size="lg" className="gap-1.5 font-semibold" />}>
            <PlusCircle className="size-4" />נהג חדש
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader className="px-6"><SheetTitle>יצירת נהג</SheetTitle></SheetHeader>
            <div className="px-6 pb-8">
              <CreateDriverForm prefill={prefill} onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['admin-drivers'] }); }} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">שם</TableHead>
                <TableHead className="font-semibold">שם משתמש</TableHead>
                <TableHead className="font-semibold">טלפון</TableHead>
                <TableHead className="font-semibold">רכב</TableHead>
                <TableHead className="font-semibold">הצטרף</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((d) => (
                <TableRow key={d.id} className="transition-colors hover:bg-accent/40">
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <span className="bg-brand-gradient grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white select-none">
                        {d.name.trim().charAt(0) || '?'}
                      </span>
                      {d.name}
                    </span>
                  </TableCell>
                  <TableCell>{d.user.username}</TableCell>
                  <TableCell>{d.phone}</TableCell>
                  <TableCell>{d.vehicleNumber} · {d.vehicleType}</TableCell>
                  <TableCell>{format(new Date(d.createdAt), 'dd/MM/yy')}</TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/admin/drivers/${d.id}`} />}>
                      <ExternalLink className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm('למחוק את הנהג?')) deleteMutation.mutate(d.id);
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
