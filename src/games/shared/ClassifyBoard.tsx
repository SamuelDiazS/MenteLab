import { Check, X } from 'lucide-react';

export interface ClassifyItem { id: string; text: string }
export interface ClassifyCategory { id: string; label: string }

export function ClassifyBoard({ items, categories, value, onChange, locked, solution, legend }: {
  items: ClassifyItem[];
  categories: ClassifyCategory[];
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  locked: boolean;
  solution: Record<string, string>;
  legend: string;
}) {
  return (
    <ul className="space-y-3" aria-label={legend}>
      {items.map((it, i) => {
        const chosen = value[it.id];
        const ok = locked && chosen === solution[it.id];
        const bad = locked && chosen !== solution[it.id];
        return (
          <li key={it.id} className={`rounded-xl border p-3 ${ok ? 'border-good/60' : bad ? 'border-bad/60' : 'border-line'} bg-raised/30`}>
            <p className="reading text-sm"><span className="mr-2 font-bold text-muted">{i + 1}.</span>{it.text}</p>
            <div role="radiogroup" aria-label={`Etiqueta para la ficha ${i + 1}`} className="mt-2 flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = chosen === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={locked}
                    onClick={() => onChange({ ...value, [it.id]: c.id })}
                    className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${active ? 'border-brand bg-brand/20 text-ink' : 'border-line text-muted hover:bg-raised'}`}
                  >
                    {active && <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />}
                    {c.label}
                  </button>
                );
              })}
            </div>
            {locked && (
              <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${ok ? 'text-good' : 'text-bad'}`}>
                {ok ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
                {ok ? 'Correcto' : `Correcta: ${categories.find((c) => c.id === solution[it.id])?.label}`}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
