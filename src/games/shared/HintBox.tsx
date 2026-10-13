import { Lightbulb } from 'lucide-react';

export function HintBox({ hints, used, onReveal, locked, cost }: { hints: string[]; used: number; onReveal: () => void; locked: boolean; cost: string }) {
  return (
    <div className="mt-4 rounded-xl border border-line bg-raised/40 p-3">
      {used > 0 && (
        <ol className="mb-3 space-y-1.5 text-sm" aria-live="polite">
          {hints.slice(0, used).map((h, i) => (
            <li key={i} className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" /><span><strong>Pista {i + 1}:</strong> {h}</span></li>
          ))}
        </ol>
      )}
      <button type="button" className="btn-ghost !min-h-[40px]" onClick={onReveal} disabled={locked || used >= hints.length}>
        <Lightbulb className="h-4 w-4" aria-hidden="true" />
        {used >= hints.length ? 'Sin más pistas' : `Pedir pista (${used + 1}/${hints.length}) · ${cost}`}
      </button>
    </div>
  );
}
