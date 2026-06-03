'use client';

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Business } from '@/types/api';
import { CreateBusinessForm } from '@/components/admin/CreateBusinessForm';
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
          <h1 className="text-xl font-bold">עסקים</h1>
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} עסקים רשומים</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button size="lg" className="gap-1.5 font-semibold" />}>
            <PlusCircle className="size-4" />עסק חדש
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader className="px-6"><SheetTitle>יצירת עסק</SheetTitle></SheetHeader>
            <div className="px-6 pb-8">
              <CreateBusinessForm onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['admin-businesses'] }); }} />
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
                <TableHead className="font-semibold">הצטרף</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((b) => (
                <TableRow key={b.id} className="transition-colors hover:bg-accent/40">
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <span className="bg-brand-gradient grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white select-none">
                        {b.name.trim().charAt(0) || '?'}
                      </span>
                      {b.name}
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
