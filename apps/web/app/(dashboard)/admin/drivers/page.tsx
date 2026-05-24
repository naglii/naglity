'use client';

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Driver } from '@/types/api';
import { CreateDriverForm } from '@/components/admin/CreateDriverForm';
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">נהגים</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button size="sm" />}>
            <PlusCircle className="size-4 ml-2" />נהג חדש
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader className="px-6"><SheetTitle>יצירת נהג</SheetTitle></SheetHeader>
            <div className="px-6 pb-8">
              <CreateDriverForm onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['admin-drivers'] }); }} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>שם משתמש</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>רכב</TableHead>
                <TableHead>הצטרף</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
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
