import { Minus, Plus } from 'lucide-react';

export function Stepper({ label, value, min = 0, max = 99, step = 1, onChange, disabled, suffix }: {
  label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; disabled?: boolean; suffix?: string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 1000) / 1000)));
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-2" role="group" aria-label={label}>
        <button type="button" className="btn-ghost !min-h-[44px] !w-11 !px-0" onClick={() => set(value - step)} disabled={disabled || value <= min} aria-label={`Disminuir ${label}`}><Minus className="h-4 w-4" aria-hidden="true" /></button>
        <output className="min-w-[3.5rem] text-center font-display text-lg font-bold" aria-live="polite">{value}{suffix}</output>
        <button type="button" className="btn-ghost !min-h-[44px] !w-11 !px-0" onClick={() => set(value + step)} disabled={disabled || value >= max} aria-label={`Aumentar ${label}`}><Plus className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, disabled, unit }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; disabled?: boolean; unit?: string;
}) {
  const id = `sl-${label.replace(/\W+/g, '')}`;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold">{label}</label>
        <output htmlFor={id} className="font-display text-lg font-bold">{value}{unit ? ` ${unit}` : ''}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 h-8 w-full accent-[rgb(var(--brand))]" />
      <div className="flex justify-between text-xs text-muted" aria-hidden="true"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}
