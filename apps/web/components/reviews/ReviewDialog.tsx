'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  jobId: string | null;
  title?: string;
  onClose: () => void;
  onDone?: () => void;
}

export function ReviewDialog({ jobId, title, onClose, onDone }: Props) {
  const open = !!jobId;
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const reset = () => { setStars(0); setHover(0); setComment(''); };

  const submit = useMutation({
    mutationFn: () => api.post(`/jobs/${jobId}/review`, { stars, comment: comment || undefined }),
    onSuccess: () => { toast.success('הדירוג נשמר — תודה!'); onDone?.(); reset(); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה בשמירת הדירוג'),
  });

  const shown = hover || stars;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-sm">
          <DialogTitle>דירוג</DialogTitle>
          {title && <DialogDescription className="mt-1">{title}</DialogDescription>}
          <div className="mt-4 flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setStars(n)}
                aria-label={`${n} כוכבים`}
              >
                <Star className={cn('size-9 transition-colors', n <= shown ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
              </button>
            ))}
          </div>
          <Textarea
            className="mt-4"
            rows={3}
            placeholder="הערה (אופציונלי)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button className="mt-3 w-full" disabled={stars === 0 || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? 'שומר…' : 'שלח דירוג'}
          </Button>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
