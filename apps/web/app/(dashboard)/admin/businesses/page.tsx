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
    onSuccess: () => { toast.success('Business deleted'); qc.invalidateQueries({ queryKey: ['admin-businesses'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Businesses</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button size="sm" />}>
            <PlusCircle className="size-4 mr-2" />New Business
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader className="px-6"><SheetTitle>Create Business</SheetTitle></SheetHeader>
            <div className="px-6 pb-8">
              <CreateBusinessForm onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['admin-businesses'] }); }} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.user.username}</TableCell>
                  <TableCell>{b.phone}</TableCell>
                  <TableCell>{format(new Date(b.createdAt), 'dd/MM/yy')}</TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/admin/businesses/${b.id}`} />}>
                      <ExternalLink className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm('Delete this business?')) deleteMutation.mutate(b.id);
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
