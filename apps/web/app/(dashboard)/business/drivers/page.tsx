'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { DriverDirectoryItem, Job } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingStars } from '@/components/reviews/RatingStars';
import {
  Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Truck, Weight, Ruler, CheckCircle2, UserPlus, Search } from 'lucide-react';

const VEHICLE_LABEL: Record<string, string> = { crane_truck: 'משאית מנוף' };
const vlabel = (v: string) => VEHICLE_LABEL[v] ?? v;

function InviteDialog({ driver, onClose }: { driver: DriverDirectoryItem | null; onClose: () => void }) {
  const open = !!driver;
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['business-jobs'],
    queryFn: () => api.get('/businesses/me/jobs').then((r) => r.data),
    enabled: open,
  });
  const openJobs = jobs.filter((j) => j.status === 'OPEN');

  const invite = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/${jobId}/invite/${driver!.id}`),
    onSuccess: () => { toast.success('הנהג הוזמן לעבודה'); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה בהזמנה'),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-sm">
          <DialogTitle>הזמנת {driver?.name} לעבודה</DialogTitle>
          <DialogDescription className="mt-1">בחר עבודה פתוחה — הנהג יקבל התראה והעבודה תופיע אצלו.</DialogDescription>
          <div className="mt-3 max-h-[55vh] space-y-2 overflow-auto">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            ) : openJobs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">אין לך עבודות פתוחות — פרסם עבודה תחילה.</p>
            ) : (
              openJobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => invite.mutate(j.id)}
                  disabled={invite.isPending}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-start transition-colors hover:bg-accent disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{j.title}</p>
                    <p className="truncate text-xs text-muted-foreground"><bdi>{j.fromLocation}</bdi> ← <bdi>{j.toLocation}</bdi></p>
                  </div>
                  <UserPlus className="size-4 shrink-0 text-brand-strong" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export default function DriverDirectoryPage() {
  const [inviteDriver, setInviteDriver] = useState<DriverDirectoryItem | null>(null);

  const { data: drivers = [], isLoading } = useQuery<DriverDirectoryItem[]>({
    queryKey: ['driver-directory'],
    queryFn: () => api.get('/drivers/directory').then((r) => r.data),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">מצא נהג מנוף</h1>
        <p className="text-sm text-muted-foreground">עיין בנהגים, בדוק דירוג וניסיון — והזמן את המתאים לעבודה שלך</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="icon-chip size-14 bg-accent text-brand-strong"><Search className="size-6" /></span>
          <p className="mt-3 font-semibold">אין נהגים להצגה עדיין</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {drivers.map((d) => (
            <Card key={d.id} className="p-0">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-2xl text-base font-bold text-white shadow-sm shadow-brand/30 select-none">
                    {d.name.trim().charAt(0) || '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{d.name}</h3>
                    <RatingStars value={d.rating.avg} count={d.rating.count} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Truck className="size-3.5" />{vlabel(d.vehicleType)}
                  </span>
                  {d.craneCapacityTons != null && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-xs font-bold text-brand-strong">
                      <Weight className="size-3.5" />{d.craneCapacityTons} טון
                    </span>
                  )}
                  {d.liftHeightMeters != null && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Ruler className="size-3.5" />גובה {d.liftHeightMeters} מ׳
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
                    <CheckCircle2 className="size-3.5" />{d.completedJobs} עבודות
                  </span>
                </div>

                <Button size="sm" className="w-full gap-1.5" onClick={() => setInviteDriver(d)}>
                  <UserPlus className="size-3.5" /> הזמן לעבודה
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InviteDialog driver={inviteDriver} onClose={() => setInviteDriver(null)} />
    </div>
  );
}
