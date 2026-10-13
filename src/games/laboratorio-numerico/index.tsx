import { useMemo, useState } from 'react';
import { gameById } from '../../data/games';
import type { GameModule, GameRuntimeProps } from '../../types';
import { pickChallenges } from '../../utils/pick';
import { ChallengeRunner, type RenderCtx } from '../shared/ChallengeRunner';
import { HintBox } from '../shared/HintBox';
import { LineChart } from '../shared/LineChart';
import { Slider, Stepper } from '../shared/Stepper';
import { Status, usePuzzle } from '../shared/usePuzzle';
import {
  MAT_CHALLENGES, type BudgetChallenge, type FenceChallenge, type FunctionChallenge, type IntervalChallenge, type ProbabilityChallenge, type RatioChallenge,
} from './data';
import { bestBudget, budgetCost, budgetValue, extremeInterval, fenceArea, linear, maxFenceArea, passesThrough, quad, ratioOk, twoDraws, unmetMinimums, urnProbability } from './logic';

const Hints = ({ p, ctx, hints }: { p: ReturnType<typeof usePuzzle>; ctx: RenderCtx; hints: string[] }) => (
  <HintBox hints={hints} used={p.hints.used} onReveal={p.hints.reveal} locked={ctx.locked} cost="−6 pts" />
);
const Check = ({ ctx, onClick, disabled, label }: { ctx: RenderCtx; onClick: () => void; disabled?: boolean; label: string }) =>
  ctx.locked ? null : <button type="button" className="btn-primary mt-3" onClick={onClick} disabled={disabled}>{label}</button>;

function RatioView({ c, ctx }: { c: RatioChallenge; ctx: RenderCtx }) {
  const [q, setQ] = useState<number[]>(c.parts.map(() => 0));
  const p = usePuzzle(c.hints.length, ctx);
  const sum = q.reduce((a, b) => a + b, 0);
  const correct = c.parts.map((x) => (x.ratio * c.total) / c.parts.reduce((a, b) => a + b.ratio, 0));
  const submit = () => {
    const ok = ratioOk(q, c.parts.map((x) => x.ratio), c.total);
    p.check(ok, sum !== c.total ? `Las cantidades suman ${sum} ${c.unit} y deben sumar ${c.total}.` : 'El total es correcto, pero la mezcla no respeta la razón.', q.join(' : '), 0);
  };
  return (
    <div>
      <p className="reading mb-4 text-sm font-semibold">{c.prompt}</p>
      <div className="card-pad space-y-3">
        {c.parts.map((x, i) => <Stepper key={x.name} label={`${x.name} (${c.unit})`} value={ctx.locked && !p.solved ? correct[i] : q[i]} max={c.total} onChange={(v) => setQ(q.map((o, j) => (j === i ? v : o)))} disabled={ctx.locked} />)}
        <p className="border-t border-line pt-2 text-sm" aria-live="polite">Total: <strong>{sum} {c.unit}</strong> de {c.total} {c.unit}</p>
      </div>
      <Hints p={p} ctx={ctx} hints={c.hints} />
      <Status {...p} />
      <Check ctx={ctx} onClick={submit} label="Verificar mezcla" />
    </div>
  );
}

function IntervalView({ c, ctx }: { c: IntervalChallenge; ctx: RenderCtx }) {
  const [sel, setSel] = useState<number | null>(null);
  const p = usePuzzle(c.hints.length, ctx);
  const answer = extremeInterval(c.data, c.mode);
  const labels = c.data.map((_, i) => i);
  const submit = () => p.check(sel === answer, 'Ese no es el intervalo con el cambio más grande.', `${sel} a ${sel! + 1}`, 0);
  return (
    <div>
      <p className="reading mb-3 text-sm font-semibold">{c.prompt}</p>
      <div className="card-pad">
        <LineChart series={[{ name: c.yLabel, values: c.data, className: 'text-c-matematicas' }]} xLabels={labels} xLabel={c.xLabel} yLabel={c.yLabel} ariaLabel={`Gráfica de ${c.yLabel} según ${c.xLabel}`} highlight={ctx.locked ? [answer, answer + 1] : sel !== null ? [sel, sel + 1] : undefined} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Intervalos">
        {c.data.slice(0, -1).map((_, i) => (
          <button key={i} type="button" role="radio" aria-checked={sel === i} disabled={ctx.locked} onClick={() => setSel(i)}
            className={`min-h-[44px] rounded-xl border px-3 text-sm font-semibold ${sel === i ? 'border-brand bg-brand/20' : 'border-line bg-raised/50'} ${ctx.locked && i === answer ? '!border-good' : ''}`}>de {i} a {i + 1}</button>
        ))}
      </div>
      <Hints p={p} ctx={ctx} hints={c.hints} />
      <Status {...p} />
      <Check ctx={ctx} onClick={submit} disabled={sel === null} label="Confirmar intervalo" />
    </div>
  );
}

function BudgetView({ c, ctx }: { c: BudgetChallenge; ctx: RenderCtx }) {
  const [q, setQ] = useState<Record<string, number>>(() => Object.fromEntries(c.items.map((i) => [i.id, i.min])));
  const p = usePuzzle(c.hints.length, ctx);
  const opt = useMemo(() => bestBudget(c.items, c.budget), [c]);
  const cost = budgetCost(c.items, q);
  const value = budgetValue(c.items, q);
  const submit = () => {
    const miss = unmetMinimums(c.items, q);
    if (cost > c.budget) return p.check(false, `Te pasas del presupuesto por $${cost - c.budget}.`, `${value} pts`, 0);
    if (miss.length) return p.check(false, `No cumples el mínimo de: ${miss.map((m) => m.name).join(', ')}.`, `${value} pts`, 0);
    p.check(value === opt, 'Cumples las condiciones, pero todavía se puede lograr más valor.', `${value} pts`, Math.round((value / opt) * 55));
  };
  return (
    <div>
      <p className="reading mb-3 text-sm font-semibold">{c.prompt}</p>
      <div className="card-pad space-y-3">
        {c.items.map((i) => (
          <div key={i.id}>
            <Stepper label={i.name} value={q[i.id]} min={i.min} max={i.max} onChange={(v) => setQ({ ...q, [i.id]: v })} disabled={ctx.locked} />
            <p className="text-xs text-muted">${i.price} c/u · {i.value} {c.valueName} c/u{i.min ? ` · mínimo ${i.min}` : ''} · máximo {i.max}</p>
          </div>
        ))}
        <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-sm" aria-live="polite">
          <div><dt className="text-xs text-muted">Gastado</dt><dd className={`font-display text-lg font-bold ${cost > c.budget ? 'text-bad' : ''}`}>${cost}</dd></div>
          <div><dt className="text-xs text-muted">Disponible</dt><dd className="font-display text-lg font-bold">${c.budget - cost}</dd></div>
          <div><dt className="text-xs text-muted">Puntos</dt><dd className="font-display text-lg font-bold">{value}</dd></div>
        </dl>
        {cost > c.budget && <p className="text-sm font-semibold text-bad">Te estás pasando del presupuesto.</p>}
      </div>
      {ctx.locked && <p className="mt-2 text-sm text-muted">Máximo posible: {opt} {c.valueName}. Tu resultado: {value}.</p>}
      <Hints p={p} ctx={ctx} hints={c.hints} />
      <Status {...p} okText="¡Óptimo! No existe una combinación mejor." />
      <Check ctx={ctx} onClick={submit} label="Comprobar compra" />
    </div>
  );
}

function Plot({ f, targets, xMax, yMax, xLabel, yLabel }: { f: (x: number) => number; targets: [number, number][]; xMax: number; yMax: number; xLabel: string; yLabel: string }) {
  const W = 420, H = 260, pl = 40, pb = 30, pt = 10, pr = 10;
  const X = (x: number) => pl + (x / xMax) * (W - pl - pr);
  const Y = (y: number) => H - pb - (y / yMax) * (H - pb - pt);
  const pts = Array.from({ length: 81 }, (_, i) => { const x = (i / 80) * xMax; return [x, f(x)] as const; }).filter(([, y]) => y >= -1 && y <= yMax + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfica de la función. Puntos objetivo: ${targets.map((t) => `(${t[0]}, ${t[1]})`).join(', ')}`} className="h-auto w-full">
      {Array.from({ length: xMax + 1 }, (_, x) => <g key={x}><line x1={X(x)} x2={X(x)} y1={pt} y2={H - pb} className="stroke-line" strokeWidth="0.7" /><text x={X(x)} y={H - 14} textAnchor="middle" fontSize="10" className="fill-muted">{x}</text></g>)}
      {Array.from({ length: Math.floor(yMax / (yMax > 10 ? 4 : 1)) + 1 }, (_, i) => { const y = i * (yMax > 10 ? 4 : 1); return <g key={y}><line x1={pl} x2={W - pr} y1={Y(y)} y2={Y(y)} className="stroke-line" strokeWidth="0.7" /><text x={pl - 5} y={Y(y) + 3} textAnchor="end" fontSize="10" className="fill-muted">{y}</text></g>; })}
      <text x={W / 2} y={H - 1} textAnchor="middle" fontSize="10" className="fill-muted">{xLabel}</text>
      <text x={2} y={9} fontSize="10" className="fill-muted">{yLabel}</text>
      <polyline fill="none" strokeWidth="3" className="stroke-c-matematicas" points={pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} />
      {targets.map(([x, y]) => <g key={`${x}-${y}`}><circle cx={X(x)} cy={Y(y)} r="6" fill="none" strokeWidth="2.5" className="stroke-warn" /><text x={X(x) + 9} y={Y(y) - 7} fontSize="10" className="fill-ink">({x}, {y})</text></g>)}
    </svg>
  );
}

function FunctionView({ c, ctx }: { c: FunctionChallenge; ctx: RenderCtx }) {
  const [m, setM] = useState(1);
  const [b, setB] = useState(0);
  const [a, setA] = useState(1);
  const [h, setH] = useState(2);
  const [k, setK] = useState(0);
  const p = usePuzzle(c.hints.length, ctx);
  const f = c.form === 'linear' ? linear(m, b) : quad(a, h, k);
  const hit = c.targets.filter(([x, y]) => Math.abs(f(x) - y) < 1e-9).length;
  const submit = () => p.check(passesThrough(f, c.targets), `Tu gráfica pasa por ${hit} de ${c.targets.length} puntos.`, c.form === 'linear' ? `m=${m}, b=${b}` : `a=${a}, p=${h}, k=${k}`, Math.round((hit / c.targets.length) * 40));
  return (
    <div>
      <p className="reading mb-3 text-sm font-semibold">{c.prompt}</p>
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="card-pad"><Plot f={f} targets={c.targets} xMax={c.xMax} yMax={c.yMax} xLabel={c.xLabel} yLabel={c.yLabel} /></div>
        <div className="card-pad space-y-3">
          {c.form === 'linear' ? (<><Slider label="Pendiente m" value={m} min={0} max={5} step={0.5} onChange={setM} disabled={ctx.locked} /><Slider label="Intercepto b" value={b} min={0} max={10} step={1} onChange={setB} disabled={ctx.locked} /></>)
            : (<><Slider label="Apertura a" value={a} min={0.25} max={2} step={0.25} onChange={setA} disabled={ctx.locked} /><Slider label="Posición p" value={h} min={0} max={8} step={1} onChange={setH} disabled={ctx.locked} /><Slider label="Altura k" value={k} min={0} max={6} step={1} onChange={setK} disabled={ctx.locked} /></>)}
          <p className="text-sm text-muted" aria-live="polite">Puntos alcanzados: {hit} de {c.targets.length}</p>
        </div>
      </div>
      <Hints p={p} ctx={ctx} hints={c.hints} />
      <Status {...p} />
      <Check ctx={ctx} onClick={submit} label="Verificar función" />
    </div>
  );
}

function ProbabilityView({ c, ctx }: { c: ProbabilityChallenge; ctx: RenderCtx }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [pctText, setPct] = useState('');
  const p = usePuzzle(c.hints.length, ctx);
  const options = c.variant === 'urns'
    ? c.urns!.map((u) => ({ id: u.id, label: u.name, prob: urnProbability(u.red, u.blue), detail: `${u.red} rojas y ${u.blue} azules` }))
    : (() => { const t = twoDraws(c.bag!.red, c.bag!.blue); return [{ id: 'rr', label: 'Dos rojas', prob: t.rr, detail: '' }, { id: 'mx', label: 'Una de cada color', prob: t.mixed, detail: '' }, { id: 'bb', label: 'Dos azules', prob: t.bb, detail: '' }]; })();
  const best = options.reduce((a, b) => (b.prob > a.prob ? b : a));
  const submit = () => {
    const okChoice = choice === best.id;
    const okPct = Math.abs(Number(pctText.replace(',', '.')) - best.prob * 100) <= 0.5;
    const issues = [!okChoice && 'la elección no es la más probable', !okPct && 'el porcentaje no coincide'].filter(Boolean).join(' y ');
    p.check(okChoice && okPct, `Revisa: ${issues}.`, `${choice} · ${pctText}%`, (okChoice ? 25 : 0) + (okPct ? 25 : 0));
  };
  return (
    <div>
      <p className="reading mb-3 text-sm font-semibold">{c.prompt}</p>
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Opciones">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={choice === o.id} disabled={ctx.locked} onClick={() => setChoice(o.id)}
            className={`card p-3 text-left ${choice === o.id ? '!border-brand ring-2 ring-brand/40' : ''} ${ctx.locked && o.id === best.id ? '!border-good' : ''}`}>
            <p className="font-bold">{o.label}</p>
            {c.variant === 'urns' && (() => { const u = c.urns!.find((x) => x.id === o.id)!; return (
              <>
                <p className="mt-1 flex flex-wrap gap-1" aria-hidden="true">{Array.from({ length: u.red }, (_, i) => <span key={`r${i}`} className="grid h-4 w-4 place-items-center rounded-full bg-bad text-[8px] font-bold text-bg">R</span>)}{Array.from({ length: u.blue }, (_, i) => <span key={`b${i}`} className="grid h-4 w-4 place-items-center rounded-full bg-c-ingles text-[8px] font-bold text-bg">A</span>)}</p>
                <p className="mt-1 text-xs text-muted">{o.detail}</p>
              </>); })()}
            {ctx.locked && <p className="mt-1 text-xs font-semibold">{Math.round(o.prob * 1000) / 10} %</p>}
          </button>
        ))}
      </div>
      <label className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">Probabilidad del resultado elegido (%)
        <input className="field w-28" type="text" inputMode="decimal" value={pctText} disabled={ctx.locked} onChange={(e) => setPct(e.target.value)} placeholder="Ej.: 25" />
      </label>
      <Hints p={p} ctx={ctx} hints={c.hints} />
      <Status {...p} />
      <Check ctx={ctx} onClick={submit} disabled={!choice || pctText.trim() === ''} label="Comprobar respuesta" />
    </div>
  );
}

function FenceView({ c, ctx }: { c: FenceChallenge; ctx: RenderCtx }) {
  const [w, setW] = useState(2);
  const p = usePuzzle(c.hints.length, ctx);
  const max = useMemo(() => maxFenceArea(c.length, c.mode), [c]);
  const len = c.mode === 'wall' ? c.length - 2 * w : c.length / 2 - w;
  const area = fenceArea(c.length, c.mode, w);
  const submit = () => p.check(Math.abs(area - max) < 1e-9, area < max ? 'Con otro ancho el área sería mayor.' : 'El área no es la máxima.', `ancho ${w} m, área ${area} m²`, Math.round((area / max) * 45));
  const sw = 40 + (w / (c.length / 2)) * 90;
  const sl = 40 + (len / c.length) * 200;
  return (
    <div>
      <p className="reading mb-3 text-sm font-semibold">{c.prompt}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-pad">
          <svg viewBox="0 0 300 200" role="img" aria-label={`Corral de ${w} m de ancho por ${len} m de largo, junto a un muro`} className="h-auto w-full">
            <rect x="20" y="20" width="260" height="8" className="fill-line" /><text x="150" y="16" textAnchor="middle" fontSize="10" className="fill-muted">muro</text>
            <rect x={150 - sl / 2} y="28" width={sl} height={sw} className="fill-c-matematicas/25 stroke-c-matematicas" strokeWidth="3" />
            <text x="150" y={28 + sw / 2 + 4} textAnchor="middle" fontSize="12" className="fill-ink">{Math.round(area * 100) / 100} m²</text>
          </svg>
        </div>
        <div className="card-pad space-y-3">
          <Slider label="Ancho w" value={w} min={1} max={c.length / 2 - 1} step={0.5} unit="m" onChange={setW} disabled={ctx.locked} />
          <p className="text-sm" aria-live="polite">Largo paralelo al muro: <strong>{len} m</strong><br />Área: <strong>{Math.round(area * 100) / 100} m²</strong></p>
        </div>
      </div>
      {ctx.locked && <p className="mt-2 text-sm text-muted">Área máxima posible: {max} m².</p>}
      <Hints p={p} ctx={ctx} hints={c.hints} />
      <Status {...p} okText="¡Área máxima encontrada!" />
      <Check ctx={ctx} onClick={submit} label="Verificar área" />
    </div>
  );
}

function Laboratorio(props: GameRuntimeProps) {
  const [challenges] = useState(() => pickChallenges(MAT_CHALLENGES, props.difficulty, props.focusSkill, props.unlockedMax));
  return (
    <ChallengeRunner challenges={challenges} report={props.report} setProgress={props.setProgress} finish={props.finish} paused={props.paused}
      render={(c, ctx) => {
        switch (c.kind) {
          case 'ratio': return <RatioView c={c} ctx={ctx} />;
          case 'interval': return <IntervalView c={c} ctx={ctx} />;
          case 'budget': return <BudgetView c={c} ctx={ctx} />;
          case 'function': return <FunctionView c={c} ctx={ctx} />;
          case 'probability': return <ProbabilityView c={c} ctx={ctx} />;
          case 'fence': return <FenceView c={c} ctx={ctx} />;
        }
      }} />
  );
}

export const laboratorioNumerico: GameModule = { meta: gameById('laboratorio-numerico')!, Component: Laboratorio };
