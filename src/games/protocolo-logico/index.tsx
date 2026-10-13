import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { pickChallenges } from '../../utils/pick';
import { gameById } from '../../data/games';
import type { GameModule, GameRuntimeProps } from '../../types';
import { usePuzzle, Status as BaseStatus } from '../shared/usePuzzle';
import { ChallengeRunner, type RenderCtx } from '../shared/ChallengeRunner';
import { HintBox } from '../shared/HintBox';
import { LOGICA_CHALLENGES, type ArrangeChallenge, type DeduceChallenge, type SequenceChallenge, type SwitchChallenge } from './data';
import { arrangeSolutions, genSequence, sameSet, switchSolutions, violatedConstraints, violatedRules, wrongMarks, type SwitchState } from './logic';

function SequenceView({ c, ctx }: { c: SequenceChallenge; ctx: RenderCtx }) {
  const terms = useMemo(() => genSequence(c.spec, c.length), [c]);
  const [vals, setVals] = useState<Record<number, string>>({});
  const p = usePuzzle(c.hints.length, ctx);
  const ready = c.hide.every((i) => vals[i] !== undefined && vals[i] !== '');
  const ok = () => c.hide.every((i) => Number(vals[i]) === terms[i]);
  const submit = () => {
    const right = c.hide.filter((i) => Number(vals[i]) === terms[i]).length;
    p.check(ok(), `${right} de ${c.hide.length} huecos son correctos.`, c.hide.map((i) => vals[i]).join(', '));
  };
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{c.prompt}</p>
      <ol className="flex flex-wrap items-center gap-2" aria-label="Secuencia">
        {terms.map((t, i) => (
          <li key={i} className="flex items-center gap-2">
            {c.hide.includes(i) ? (
              ctx.locked ? (
                <span className={`grid h-14 min-w-[3.5rem] place-items-center rounded-xl border-2 px-2 font-display text-xl font-bold ${p.solved ? 'border-good text-good' : 'border-bad text-bad'}`}>{t}</span>
              ) : (
                <input type="number" inputMode="numeric" aria-label={`Término ${i + 1} (falta)`} value={vals[i] ?? ''} onChange={(e) => setVals({ ...vals, [i]: e.target.value })} className="field h-14 w-20 border-2 border-dashed border-brand text-center font-display text-xl font-bold" />
              )
            ) : (
              <span className="grid h-14 min-w-[3.5rem] place-items-center rounded-xl bg-raised px-2 font-display text-xl font-bold">{t}</span>
            )}
            {i < terms.length - 1 && <span className="text-muted" aria-hidden="true">›</span>}
          </li>
        ))}
      </ol>
      <HintBox hints={c.hints} used={p.hints.used} onReveal={p.hints.reveal} locked={ctx.locked} cost="−6 pts" />
      <BaseStatus okText="¡Protocolo resuelto!" failText="Se agotaron los intentos. Abajo tienes la solución y la regla." attempts={p.attempts} msg={p.msg} solved={p.solved} />
      {!ctx.locked && <button type="button" className="btn-primary mt-3" onClick={submit} disabled={!ready}>Verificar secuencia</button>}
    </div>
  );
}

function ArrangeView({ c, ctx }: { c: ArrangeChallenge; ctx: RenderCtx }) {
  const n = c.items.length;
  const [slots, setSlots] = useState<(string | null)[]>(Array(n).fill(null));
  const [held, setHeld] = useState<string | null>(null);
  const p = usePuzzle(c.hints.length, ctx);
  const solution = useMemo(() => arrangeSolutions(c.items.map((i) => i.id), c.clues)[0], [c]);
  const label = (id: string) => c.items.find((i) => i.id === id)!.label;
  const placed = new Set(slots.filter(Boolean) as string[]);
  const full = slots.every(Boolean);
  const shown = ctx.locked && !p.solved ? solution : slots;
  const toSlot = (i: number) => {
    if (ctx.locked) return;
    if (held) { const next = [...slots]; const prev = next.indexOf(held); if (prev >= 0) next[prev] = null; next[i] = held; setSlots(next); setHeld(null); }
    else if (slots[i]) { const next = [...slots]; next[i] = null; setSlots(next); }
  };
  const submit = () => {
    const order = slots as string[];
    const bad = violatedConstraints(order, c.clues);
    p.check(bad.length === 0, `Incumples ${bad.length === 1 ? 'la regla' : 'las reglas'} ${bad.map((b) => b + 1).join(', ')}.`, order.map(label).join(' > '));
  };
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{c.prompt}</p>
      <ol className="mb-4 space-y-1.5 text-sm" aria-label="Reglas">
        {c.clues.map((cl, i) => {
          return <li key={i} className="flex gap-2"><span className="font-bold text-muted">{i + 1}.</span><span>{cl.text}</span></li>;
        })}
      </ol>
      <p className="mb-2 text-xs text-muted">Toca una pieza y luego una franja. Toca una franja ocupada para devolver la pieza.</p>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Piezas disponibles">
        {c.items.map((it) => (
          <button key={it.id} type="button" disabled={ctx.locked || placed.has(it.id)} aria-pressed={held === it.id} onClick={() => setHeld(held === it.id ? null : it.id)}
            className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-bold ${held === it.id ? 'border-brand bg-brand/25' : 'border-line bg-raised'} disabled:opacity-30`}>{it.label}</button>
        ))}
      </div>
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(n, 5)}, minmax(0, 1fr))` }} aria-label="Franjas">
        {shown.map((id, i) => (
          <li key={i}>
            <button type="button" onClick={() => toSlot(i)} disabled={ctx.locked} aria-label={`${c.slotLabel} ${i + 1}: ${id ? label(id) : 'vacía'}`}
              className={`flex min-h-[72px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-1 text-center text-sm font-bold ${id ? 'border-brand bg-brand/10' : 'border-line'} ${held && !id ? 'ring-2 ring-brand/40' : ''}`}>
              <span className="text-xs font-normal text-muted">{c.slotLabel} {i + 1}</span>
              {id ? label(id) : '—'}
            </button>
          </li>
        ))}
      </ol>
      {ctx.locked && !p.solved && <p className="mt-2 text-sm text-muted">Solución mostrada arriba.</p>}
      <HintBox hints={c.hints} used={p.hints.used} onReveal={p.hints.reveal} locked={ctx.locked} cost="−6 pts" />
      <BaseStatus okText="¡Protocolo resuelto!" failText="Se agotaron los intentos. Abajo tienes la solución y la regla." attempts={p.attempts} msg={p.msg} solved={p.solved} />
      {!ctx.locked && <button type="button" className="btn-primary mt-3" onClick={submit} disabled={!full}>Verificar orden</button>}
    </div>
  );
}

function SwitchView({ c, ctx }: { c: SwitchChallenge; ctx: RenderCtx }) {
  const [state, setState] = useState<SwitchState>(() => Object.fromEntries(c.vars.map((v) => [v.id, false])));
  const p = usePuzzle(c.hints.length, ctx);
  const solution = useMemo(() => switchSolutions(c.vars.map((v) => v.id), c.rules)[0], [c]);
  const shown = ctx.locked && !p.solved ? solution : state;
  const bad = violatedRules(state, c.rules);
  const submit = () => p.check(bad.length === 0, `Incumples ${bad.length === 1 ? 'la regla' : 'las reglas'} ${bad.map((b) => b + 1).join(', ')}.`, c.vars.map((v) => `${v.id}=${state[v.id] ? 'sí' : 'no'}`).join(' '));
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{c.prompt}</p>
      <ol className="mb-4 space-y-1.5 text-sm" aria-label="Reglas del panel">
        {c.rules.map((r, i) => <li key={i} className="flex gap-2"><span className="font-bold text-muted">{i + 1}.</span>{r.text}</li>)}
      </ol>
      <div className="flex flex-wrap gap-3" role="group" aria-label="Interruptores">
        {c.vars.map((v) => {
          const on = shown[v.id];
          return (
            <button key={v.id} type="button" role="switch" aria-checked={on} disabled={ctx.locked} aria-label={`Interruptor ${v.label}`} onClick={() => setState({ ...state, [v.id]: !state[v.id] })}
              className={`flex min-h-[64px] w-24 flex-col items-center justify-center rounded-2xl border-2 font-display text-2xl font-extrabold transition-colors ${on ? 'border-c-logica bg-c-logica/25' : 'border-line bg-raised'}`}>
              {v.label}<span className="text-xs font-semibold text-muted">{on ? 'Encendido' : 'Apagado'}</span>
            </button>
          );
        })}
      </div>
      <HintBox hints={c.hints} used={p.hints.used} onReveal={p.hints.reveal} locked={ctx.locked} cost="−6 pts" />
      <BaseStatus okText="¡Protocolo resuelto!" failText="Se agotaron los intentos. Abajo tienes la solución y la regla." attempts={p.attempts} msg={p.msg} solved={p.solved} />
      {!ctx.locked && <button type="button" className="btn-primary mt-3" onClick={submit}>Probar configuración</button>}
    </div>
  );
}

function DeduceView({ c, ctx }: { c: DeduceChallenge; ctx: RenderCtx }) {
  const [sel, setSel] = useState<string[]>([]);
  const p = usePuzzle(c.hints.length, ctx);
  const all = c.options.map((o) => o.id);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const submit = () => {
    const wrong = wrongMarks(sel, c.correct, all);
    p.check(sameSet(sel, c.correct), `${wrong === 1 ? 'Una marca no es correcta' : `${wrong} marcas no son correctas`} (sobrantes o faltantes).`, sel.join(', ') || 'ninguna');
  };
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{c.prompt}</p>
      <div className="card-pad !bg-raised/30">
        <p className="text-xs font-bold text-muted">Premisas</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{c.premises.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
      <ul className="mt-4 space-y-2" aria-label="Conclusiones posibles">
        {c.options.map((o) => {
          const on = sel.includes(o.id);
          const right = ctx.locked && c.correct.includes(o.id);
          const wrong = ctx.locked && on && !c.correct.includes(o.id);
          return (
            <li key={o.id}>
              <button type="button" role="checkbox" aria-checked={on} disabled={ctx.locked} onClick={() => toggle(o.id)}
                className={`kbd-tile flex w-full items-start gap-2 ${on ? '!border-brand !bg-brand/15' : ''} ${right ? '!border-good' : ''} ${wrong ? '!border-bad' : ''}`}>
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? 'border-brand bg-brand text-bg' : 'border-muted'}`}>{on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}</span>
                <span>{o.text}{right && <span className="ml-2 text-xs font-bold text-good">(se sigue)</span>}{wrong && <X className="ml-1 inline h-4 w-4 text-bad" aria-label="No se sigue" />}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <HintBox hints={c.hints} used={p.hints.used} onReveal={p.hints.reveal} locked={ctx.locked} cost="−6 pts" />
      <BaseStatus okText="¡Protocolo resuelto!" failText="Se agotaron los intentos. Abajo tienes la solución y la regla." attempts={p.attempts} msg={p.msg} solved={p.solved} />
      {!ctx.locked && <button type="button" className="btn-primary mt-3" onClick={submit}>Verificar conclusiones</button>}
    </div>
  );
}

function ProtocoloLogico(props: GameRuntimeProps) {
  const [challenges] = useState(() => pickChallenges(LOGICA_CHALLENGES, props.difficulty, props.focusSkill, props.unlockedMax));
  return (
    <ChallengeRunner
      challenges={challenges}
      report={props.report}
      setProgress={props.setProgress}
      finish={props.finish}
      paused={props.paused}
      render={(c, ctx) => c.kind === 'sequence' ? <SequenceView c={c} ctx={ctx} /> : c.kind === 'arrange' ? <ArrangeView c={c} ctx={ctx} /> : c.kind === 'switches' ? <SwitchView c={c} ctx={ctx} /> : <DeduceView c={c} ctx={ctx} />}
    />
  );
}

export const protocoloLogico: GameModule = { meta: gameById('protocolo-logico')!, Component: ProtocoloLogico };
