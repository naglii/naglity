'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '@/lib/api';
import type { Business } from '@/types/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, ExternalLink, CheckCircle2, Clock } from 'lucide-react';

interface CustomerRow extends Business {
  user: { username: string; email?: string | null };
}

export default function AdminCustomersPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<CustomerRow[]>({
    queryKey: ['admin-customers'],
    queryFn: () => api.get('/admin/customers').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/businesses/${id}`),
    onSuccess: () => { toast.success('הלקוח נמחק'); qc.invalidateQueries({ queryKey: ['admin-customers'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">לקוחות</h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} לקוחות שנרשמו בעצמם</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">אין לקוחות עדיין</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">שם</TableHead>
                <TableHead className="font-semibold">שם משתמש</TableHead>
                <TableHead className="font-semibold">טלפון</TableHead>
                <TableHead className="font-semibold">אימות טלפון</TableHead>
                <TableHead className="font-semibold">הצטרף</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((c) => (
                <TableRow key={c.id} className="transition-colors hover:bg-accent/40">
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <span className="bg-brand-gradient grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white select-none">
                        {c.name.trim().charAt(0) || '?'}
                      </span>
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell>{c.user.username}</TableCell>
                  <TableCell><bdi>{c.phone}</bdi></TableCell>
                  <TableCell>
                    {c.phoneVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                        <CheckCircle2 className="size-3" />מאומת
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
                        <Clock className="size-3" />ממתין
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(c.createdAt), 'dd/MM/yy')}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/admin/businesses/${c.id}`} />}>
                      <ExternalLink className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('למחוק את הלקוח?')) deleteMutation.mutate(c.id); }}>
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
