import { useState } from 'react';
import { Check, Play } from 'lucide-react';
import { gameById } from '../../data/games';
import type { GameModule, GameRuntimeProps } from '../../types';
import { useHints } from '../../hooks/useHints';
import { applyHintPenalty, classifyScore } from '../../utils/scoring';
import { pickChallenges } from '../../utils/pick';
import { ChallengeRunner, type RenderCtx } from '../shared/ChallengeRunner';
import { ClassifyBoard } from '../shared/ClassifyBoard';
import { HintBox } from '../shared/HintBox';
import { LineChart } from '../shared/LineChart';
import { Slider } from '../shared/Stepper';
import { Status, usePuzzle } from '../shared/usePuzzle';
import { CIENCIAS_CHALLENGES, type ClassifyChallenge, type DesignChallenge, type SimChallenge } from './data';
import { differingVars, isValidComparison, MAX_RUNS, simScore } from './logic';
import { MODELS, type Params, type SimOutput } from './models';

function ClassifyView({ c, ctx }: { c: ClassifyChallenge; ctx: RenderCtx }) {
  const [val, setVal] = useState<Record<string, string>>({});
  const hints = useHints(c.hints.length);
  const solution = Object.fromEntries(c.items.map((i) => [i.id, i.answer]));
  return (
    <div>
      <p className="reading mb-3 text-sm">{c.scenario}</p>
      {c.table && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full max-w-lg text-left text-sm">
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

function SimView({ c, ctx }: { c: SimChallenge; ctx: RenderCtx }) {
  const model = MODELS[c.model];
  const [params, setParams] = useState<Params>(() => Object.fromEntries(model.params.map((p) => [p.id, p.def])));
  const [pred, setPred] = useState<string | null>(null);
  const [runs, setRuns] = useState(0);
  const [out, setOut] = useState<SimOutput | null>(null);
  const hints = useHints(c.hints.length);
  const predOk = pred === c.prediction.correct;

  const run = () => {
    const o = model.run(params);
    const n = runs + 1;
    setRuns(n);
    setOut(o);
    if (o.goalMet) ctx.resolve({ score: simScore(n, predOk, hints.used), attempts: n, hintsUsed: hints.used, answer: JSON.stringify(params) });
    else if (n >= MAX_RUNS) ctx.resolve({ score: simScore(null, predOk, hints.used), attempts: n, hintsUsed: hints.used, answer: JSON.stringify(params) });
  };
  const won = ctx.locked && out?.goalMet;

  return (
    <div>
      <p className="reading text-sm">{model.context}</p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="card-pad !bg-raised/30">
          <h3 className="text-sm font-bold">Reglas del modelo</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{model.rules.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
        <div className="card-pad !bg-raised/30">
          <h3 className="text-sm font-bold">Objetivo</h3>
          <p className="mt-1 text-sm">{model.goal}</p>
        </div>
      </div>

      <fieldset className="card-pad mt-4" disabled={ctx.locked || runs > 0}>
        <legend className="px-1 text-sm font-bold">1 · Formula tu hipótesis</legend>
        <p className="mb-2 text-sm">{c.prediction.question}</p>
        <div role="radiogroup" aria-label="Hipótesis" className="flex flex-wrap gap-2">
          {c.prediction.options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={pred === o.id} onClick={() => setPred(o.id)} className={`min-h-[44px] rounded-xl border px-4 text-sm font-semibold ${pred === o.id ? 'border-brand bg-brand/20' : 'border-line bg-raised/50'}`}>
              {pred === o.id && <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />}{o.text}
            </button>
          ))}
        </div>
      </fieldset>

      <section className="card-pad mt-4" aria-label="Variables de la simulación">
        <h3 className="mb-3 text-sm font-bold">2 · Cambia las variables y ejecuta</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {model.params.map((p) => <Slider key={p.id} label={p.label} unit={p.unit} min={p.min} max={p.max} step={p.step} value={params[p.id]} onChange={(v) => setParams({ ...params, [p.id]: v })} disabled={ctx.locked} />)}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!ctx.locked && <button type="button" className="btn-primary" onClick={run} disabled={pred === null}><Play className="h-4 w-4" aria-hidden="true" />Ejecutar simulación</button>}
          <span className="text-sm text-muted">Ejecuciones: {runs} de {MAX_RUNS}</span>
          {pred === null && !ctx.locked && <span className="text-sm text-warn">Elige primero una hipótesis.</span>}
        </div>
      </section>

      {out && (
        <section className="card-pad anim-rise mt-4" aria-live="polite">
          <h3 className="mb-2 text-sm font-bold">3 · Resultados</h3>
          <LineChart series={out.series} xLabels={out.xLabels} xLabel={out.xLabel} yLabel={out.yLabel} ariaLabel={`Resultado de la simulación: ${out.goalReport}`} />
          <dl className="mt-3 flex flex-wrap gap-3">{out.metrics.map((m) => <div key={m.label} className="rounded-xl bg-raised/50 px-3 py-2"><dt className="text-xs text-muted">{m.label}</dt><dd className="font-display font-bold">{m.value}</dd></div>)}</dl>
          <p className={`mt-3 text-sm font-semibold ${out.goalMet ? 'text-good' : 'text-warn'}`}>{out.goalReport}</p>
        </section>
      )}
      {ctx.locked && <p className="mt-3 text-sm font-semibold">{predOk ? 'Tu hipótesis se confirmó con el modelo.' : 'Tu hipótesis no coincidió con lo que muestra el modelo.'}</p>}

      <HintBox hints={c.hints} used={hints.used} onReveal={hints.reveal} locked={ctx.locked} cost="−6 pts" />
      <Status attempts={runs} msg={null} solved={ctx.locked ? !!won : null} okText="¡Meta alcanzada!" failText="No alcanzaste la meta en las ejecuciones disponibles." />
    </div>
  );
}

function DesignView({ c, ctx }: { c: DesignChallenge; ctx: RenderCtx }) {
  const [sel, setSel] = useState<string[]>([]);
  const p = usePuzzle(c.hints.length, ctx);
  const keys = Object.keys(c.varLabels);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]));
  const submit = () => {
    const [a, b] = sel.map((id) => c.groups.find((g) => g.id === id)!);
    const ok = isValidComparison(a, b, c.variable);
    const diff = differingVars(a, b);
    p.check(ok, diff.length === 0 ? 'Esos grupos son idénticos: no hay nada que comparar.' : diff.length === 1 ? 'Esos grupos cambian una sola variable, pero no es la de la hipótesis.' : `Esos grupos difieren en ${diff.length} variables a la vez.`, sel.join(' vs '));
  };
  return (
    <div>
      <p className="mb-1 text-xs text-muted">Hipótesis a poner a prueba</p>
      <p className="reading mb-3 font-semibold">{c.hypothesis}</p>
      <p className="mb-2 text-sm">Elige DOS grupos que permitan comprobar la hipótesis con una comparación justa.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead><tr><th className="px-3 py-2">Elegir</th><th className="px-3">Grupo</th>{keys.map((k) => <th key={k} className="px-3">{c.varLabels[k]}</th>)}</tr></thead>
          <tbody>
            {c.groups.map((g) => {
              const on = sel.includes(g.id);
              return (
                <tr key={g.id} className={`border-t border-line ${on ? 'bg-brand/15' : ''}`}>
                  <td className="px-3 py-2"><button type="button" role="checkbox" aria-checked={on} aria-label={`Elegir ${g.id}`} disabled={ctx.locked} onClick={() => toggle(g.id)} className={`grid h-9 w-9 place-items-center rounded-lg border ${on ? 'border-brand bg-brand text-bg' : 'border-line'}`}>{on && <Check className="h-4 w-4" aria-hidden="true" />}</button></td>
                  <td className="px-3 font-bold">{g.id}</td>
                  {keys.map((k) => <td key={k} className="px-3">{g.values[k]}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <HintBox hints={c.hints} used={p.hints.used} onReveal={p.hints.reveal} locked={ctx.locked} cost="−6 pts" />
      <Status {...p} okText="¡Comparación justa!" />
      {!ctx.locked && <button type="button" className="btn-primary mt-3" disabled={sel.length !== 2} onClick={submit}>Verificar diseño</button>}
    </div>
  );
}

function Ecosistema(props: GameRuntimeProps) {
  const [challenges] = useState(() => pickChallenges(CIENCIAS_CHALLENGES, props.difficulty, props.focusSkill, props.unlockedMax));
  return (
    <ChallengeRunner challenges={challenges} report={props.report} setProgress={props.setProgress} finish={props.finish} paused={props.paused}
      render={(c, ctx) => (c.kind === 'classify' ? <ClassifyView c={c} ctx={ctx} /> : c.kind === 'sim' ? <SimView c={c} ctx={ctx} /> : <DesignView c={c} ctx={ctx} />)} />
  );
}

export const ecosistema404: GameModule = { meta: gameById('ecosistema-404')!, Component: Ecosistema };
