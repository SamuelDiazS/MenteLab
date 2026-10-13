import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { gameById } from '../../data/games';
import type { GameModule, GameRuntimeProps } from '../../types';
import { useHints } from '../../hooks/useHints';
import { applyHintPenalty, classifyScore } from '../../utils/scoring';
import { pickChallenges } from '../../utils/pick';
import { ChallengeRunner, type RenderCtx } from '../shared/ChallengeRunner';
import { ClassifyBoard } from '../shared/ClassifyBoard';
import { HintBox } from '../shared/HintBox';
import { ProgressBar } from '../../components/ui';
import { Stepper } from '../shared/Stepper';
import { Status, usePuzzle } from '../shared/usePuzzle';
import { SOCIALES_CHALLENGES, type CityBudgetChallenge, type ClassifyChallenge, type DecisionChallenge } from './data';
import { bestOptions, decisionScore, findAllocation, indicatorValues, INDICATORS, scoreOption, SECTORS, totalSpent, unmetGoals, type Allocation } from './logic';

const EMPTY: Allocation = { educacion: 0, salud: 0, movilidad: 0, seguridad: 0, ambiente: 0 };

function BudgetView({ c, ctx }: { c: CityBudgetChallenge; ctx: RenderCtx }) {
  const [a, setA] = useState<Allocation>(EMPTY);
  const p = usePuzzle(c.hints.length, ctx);
  const example = useMemo(() => findAllocation(c.weights, c.goals), [c]);
  const shown = ctx.locked && !p.solved && example ? example : a;
  const spent = totalSpent(shown);
  const vals = indicatorValues(c.weights, shown);
  const unmet = unmetGoals(c.weights, c.goals, shown);
  const goalKeys = Object.keys(c.goals) as (keyof typeof c.goals)[];
  const submit = () => {
    const total = goalKeys.length;
    const met = total - unmet.length;
    if (spent > 100) return p.check(false, 'Excedes el presupuesto de 100 puntos.', JSON.stringify(a), 0);
    p.check(unmet.length === 0, `Cumples ${met} de ${total} metas.`, JSON.stringify(a), Math.round((met / total) * 45));
  };
  return (
    <div>
      <p className="reading text-sm">{c.scenario}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{c.facts.map((f) => <div key={f.label} className="rounded-xl bg-raised/50 p-3"><dt className="text-xs text-muted">{f.label}</dt><dd className="font-display text-lg font-bold">{f.value}</dd></div>)}</dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card-pad" aria-label="Distribución del presupuesto">
          <h3 className="mb-3 text-sm font-bold">Reparte el presupuesto</h3>
          <div className="space-y-3">
            {SECTORS.map((s) => <Stepper key={s.id} label={s.label} value={shown[s.id]} step={5} max={100} onChange={(v) => setA({ ...a, [s.id]: v })} disabled={ctx.locked} />)}
          </div>
          <p className={`mt-3 border-t border-line pt-2 text-sm font-semibold ${spent > 100 ? 'text-bad' : ''}`} aria-live="polite">Usados: {spent} de 100 puntos{spent > 100 ? ' · te pasas del límite' : ` · disponibles: ${100 - spent}`}</p>
          {ctx.locked && !p.solved && <p className="mt-1 text-xs text-muted">Se muestra un ejemplo de distribución que sí cumple las metas.</p>}
        </section>

        <section className="card-pad" aria-label="Indicadores de la ciudad">
          <h3 className="mb-3 text-sm font-bold">Indicadores (0 a 100)</h3>
          <ul className="space-y-3">
            {INDICATORS.map((i) => {
              const goal = c.goals[i.id];
              const ok = goal === undefined || vals[i.id] >= goal;
              return (
                <li key={i.id}>
                  <div className="mb-1 flex items-center justify-between text-sm"><span>{i.label}</span>
                    <span className="flex items-center gap-1.5 font-semibold">{Math.round(vals[i.id])}
                      {goal !== undefined && <span className={`chip ${ok ? '!text-good' : '!text-bad'}`}>{ok ? <Check className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}meta {goal}{ok ? ' · cumple' : ' · falta'}</span>}</span></div>
                  <ProgressBar value={vals[i.id] / 100} label={`${i.label}: ${Math.round(vals[i.id])}`} tone={ok ? 'bg-good' : 'bg-brand'} />
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <details className="card mt-4 p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Reglas visibles: cómo se calculan los indicadores</summary>
        <p className="mt-2 text-muted">El efecto de un sector con p puntos es 100·p/(p+15). Cada indicador es la suma del efecto de cada sector multiplicado por su peso:</p>
        <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[460px] text-left text-xs">
          <thead><tr><th className="py-1 pr-2">Indicador</th>{SECTORS.map((s) => <th key={s.id} className="pr-2">{s.label}</th>)}</tr></thead>
          <tbody>{INDICATORS.map((i) => <tr key={i.id} className="border-t border-line"><td className="py-1 pr-2 font-semibold">{i.label}</td>{c.weights[i.id].map((w, k) => <td key={k} className="pr-2">{Math.round(w * 100)} %</td>)}</tr>)}</tbody>
        </table></div>
      </details>

      <HintBox hints={c.hints} used={p.hints.used} onReveal={p.hints.reveal} locked={ctx.locked} cost="−6 pts" />
      <Status {...p} okText="¡Presupuesto aprobado: se cumplen todas las metas!" />
      {!ctx.locked && <button type="button" className="btn-primary mt-3" onClick={submit}>Aprobar presupuesto</button>}
    </div>
  );
}

function ClassifyView({ c, ctx }: { c: ClassifyChallenge; ctx: RenderCtx }) {
  const [val, setVal] = useState<Record<string, string>>({});
  const hints = useHints(c.hints.length);
  const solution = Object.fromEntries(c.items.map((i) => [i.id, i.answer]));
  return (
    <div>
      <p className="reading mb-3 text-sm">{c.scenario}</p>
      {c.table && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[360px] max-w-xl text-left text-sm">
            <caption className="mb-1 text-left text-xs font-semibold text-muted">{c.table.caption}</caption>
            <thead><tr>{c.table.head.map((h) => <th key={h} className="border-b border-line px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{c.table.rows.map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j} className="border-b border-line/50 px-3 py-1.5">{x}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      <p className="mb-2 text-sm font-semibold">{c.prompt}</p>
      <ClassifyBoard items={c.items} categories={c.categories} value={val} onChange={setVal} locked={ctx.locked} solution={solution} legend={c.prompt} />
      <HintBox hints={c.hints} used={hints.used} onReveal={hints.reveal} locked={ctx.locked} cost="−8 pts" />
      {!ctx.locked && <button type="button" className="btn-primary mt-4" disabled={!c.items.every((i) => val[i.id])} onClick={() => ctx.resolve({ score: applyHintPenalty(classifyScore(val, solution), hints.used), hintsUsed: hints.used })}>Entregar análisis</button>}
    </div>
  );
}

function DecisionView({ c, ctx }: { c: DecisionChallenge; ctx: RenderCtx }) {
  const [crit, setCrit] = useState<string | null>(null);
  const [opt, setOpt] = useState<string | null>(null);
  const [datum, setDatum] = useState<string | null>(null);
  const hints = useHints(c.hints.length);
  const criterion = c.criteria.find((x) => x.id === crit);
  const submit = () => {
    const best = bestOptions(c.options, criterion!.weights);
    const supports = c.data.find((d) => d.id === datum)!.supports.includes(crit!);
    ctx.resolve({ score: applyHintPenalty(decisionScore(best.includes(opt!), supports), hints.used, 6), hintsUsed: hints.used, answer: `${crit} / ${opt} / ${datum}` });
  };
  const Radio = ({ name, value, set, children, right }: { name: string; value: string | null; set: (v: string) => void; children: React.ReactNode; right?: boolean }) => (
    <button type="button" role="radio" aria-checked={value === name} disabled={ctx.locked} onClick={() => set(name)} className={`kbd-tile block w-full ${value === name ? '!border-brand !bg-brand/15' : ''} ${right ? '!border-good' : ''}`}>{value === name && <Check className="mr-1 inline h-4 w-4" aria-hidden="true" />}{children}</button>
  );
  return (
    <div>
      <p className="reading text-sm">{c.scenario}</p>
      <h3 className="mb-2 mt-4 text-sm font-bold">1 · Criterio de decisión</h3>
      <div role="radiogroup" aria-label="Criterio" className="grid gap-2 sm:grid-cols-3">
        {c.criteria.map((k) => <Radio key={k.id} name={k.id} value={crit} set={setCrit}><strong>{k.label}</strong><span className="block text-xs text-muted">{k.desc}</span></Radio>)}
      </div>
      <h3 className="mb-2 mt-4 text-sm font-bold">2 · Opciones y efectos estimados</h3>
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm">
        <thead><tr className="text-xs text-muted"><th className="py-1 pr-2">Opción</th><th>Bienestar</th><th>Equidad</th><th>Presupuesto</th><th>Sostenib.</th>{ctx.locked && criterion && <th>Puntaje</th>}</tr></thead>
        <tbody>{c.options.map((o) => (
          <tr key={o.id} className="border-t border-line">
            <td className="py-1.5 pr-2"><div role="radiogroup" aria-label="Opción"><Radio name={o.id} value={opt} set={setOpt} right={ctx.locked && !!criterion && bestOptions(c.options, criterion.weights).includes(o.id)}><strong>{o.name}</strong><span className="block text-xs text-muted">{o.desc}</span></Radio></div></td>
            <td>{o.effects.bienestar > 0 ? '+' : ''}{o.effects.bienestar}</td><td>{o.effects.equidad > 0 ? '+' : ''}{o.effects.equidad}</td><td>{o.effects.presupuesto > 0 ? '+' : ''}{o.effects.presupuesto}</td><td>{o.effects.sostenibilidad > 0 ? '+' : ''}{o.effects.sostenibilidad}</td>
            {ctx.locked && criterion && <td className="font-semibold">{scoreOption(o.effects, criterion.weights)}</td>}
          </tr>))}</tbody>
      </table></div>
      <h3 className="mb-2 mt-4 text-sm font-bold">3 · Dato que respalda tu decisión</h3>
      <div role="radiogroup" aria-label="Dato" className="space-y-2">
        {c.data.map((d) => <Radio key={d.id} name={d.id} value={datum} set={setDatum} right={ctx.locked && !!crit && d.supports.includes(crit)}>{d.text}</Radio>)}
      </div>
      <HintBox hints={c.hints} used={hints.used} onReveal={hints.reveal} locked={ctx.locked} cost="−6 pts" />
      {!ctx.locked && <button type="button" className="btn-primary mt-4" disabled={!crit || !opt || !datum} onClick={submit}>Registrar decisión</button>}
    </div>
  );
}

function Ciudad(props: GameRuntimeProps) {
  const [challenges] = useState(() => pickChallenges(SOCIALES_CHALLENGES, props.difficulty, props.focusSkill, props.unlockedMax));
  return (
    <ChallengeRunner challenges={challenges} report={props.report} setProgress={props.setProgress} finish={props.finish} paused={props.paused}
      render={(c, ctx) => (c.kind === 'budget' ? <BudgetView c={c} ctx={ctx} /> : c.kind === 'classify' ? <ClassifyView c={c} ctx={ctx} /> : <DecisionView c={c} ctx={ctx} />)} />
  );
}

export const ciudadEnEquilibrio: GameModule = { meta: gameById('ciudad-en-equilibrio')!, Component: Ciudad };
