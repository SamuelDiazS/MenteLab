import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function ProgressBar({ value, label, tone = 'bg-brand' }: { value: number; label: string; tone?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 w-full overflow-hidden rounded-full bg-raised">
      <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({ open, title, children, onClose, labelledBy = 'modal-title' }: { open: boolean; title: string; children: ReactNode; onClose: () => void; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="card anim-rise w-full max-w-md p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 id={labelledBy} className="text-xl font-bold">{title}</h2>
          <button type="button" className="btn-ghost !min-h-[36px] !px-2" onClick={onClose} aria-label="Cerrar diálogo"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = 'Cancelar', danger, onConfirm, onCancel }: {
  open: boolean; title: string; message: ReactNode; confirmLabel: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="text-sm leading-relaxed text-muted">{message}</div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel} data-autofocus>{cancelLabel}</button>
        <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function EmptyState({ title, text, action, page }: { title: string; text: string; action?: ReactNode; page?: boolean }) {
  const Title = page ? 'h1' : 'h2';
  return (
    <div className="card-pad text-center">
      <Title className="font-display text-lg font-bold">{title}</Title>
      <p className="mx-auto mt-1 max-w-prose text-sm text-muted">{text}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Confetti({ colors }: { colors: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <span key={i} className="confetti-bit" style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 8) * 0.08}s` }} />
      ))}
    </div>
  );
}
