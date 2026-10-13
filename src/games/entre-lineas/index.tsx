import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { applyHintPenalty, classifyScore } from '../../utils/scoring';
import { pickChallenges } from '../../utils/pick';
import { HINT_PENALTY } from '../../config';
import { gameById } from '../../data/games';
import type { GameModule, GameRuntimeProps } from '../../types';
import { ChallengeRunner, type RenderCtx } from '../shared/ChallengeRunner';
import { ClassifyBoard } from '../shared/ClassifyBoard';
import { HintBox } from '../shared/HintBox';
import { useHints } from '../../hooks/useHints';
import { flatten, LECTURA_CHALLENGES, type ClassifyChallenge, type InferenceChallenge, type Paragraphs, type SelectChallenge } from './data';
import { scoreInference, scoreSelect } from './logic';

function Sentences({ text, selected, onToggle, locked, correct, evidence }: { text: Paragraphs; selected: number[]; onToggle?: (i: number) => void; locked: boolean; correct?: number[]; evidence?: number[] }) {
  let idx = -1;
  return (
    <div className="card-pad !bg-raised/30">
      {text.map((p, pi) => (
        <p key={pi} className="reading mb-3 last:mb-0">
          {p.map((s) => {
            idx += 1;
            const i = idx;
            const sel = selected.includes(i);
            const isRight = locked && (correct ? correct.includes(i) : evidence?.includes(i));
            const isWrong = locked && sel && !isRight;
            return (
              <button
                key={i}
                type="button"
                disabled={locked || !onToggle}
                aria-pressed={sel}
                onClick={() => onToggle?.(i)}
                className={`mr-1 inline rounded px-1 py-0.5 text-left transition-colors ${sel ? 'bg-c-lectura/30 underline decoration-2 underline-offset-4' : 'hover:bg-raised'} ${isRight ? 'ring-2 ring-good' : ''} ${isWrong ? 'ring-2 ring-bad' : ''}`}
              >
                <span className="mr-1 align-super text-[0.65rem] font-bold text-muted">{i + 1}</span>
                {s}
                {locked && isRight && <Check className="ml-1 inline h-3.5 w-3.5 text-good" aria-label="Sustenta la respuesta" />}
                {locked && isWrong && <X className="ml-1 inline h-3.5 w-3.5 text-bad" aria-label="No era la correcta" />}
              </button>
            );
          })}
        </p>
      ))}
    </div>
  );
}

function SelectView({ c, ctx }: { c: SelectChallenge; ctx: RenderCtx }) {
  const [sel, setSel] = useState<number[]>([]);
  const hints = useHints(c.hints.length);
  const toggle = (i: number) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : s.length >= c.maxSelect ? (c.maxSelect === 1 ? [i] : s) : [...s, i]));
  const submit = () => ctx.resolve({ score: applyHintPenalty(scoreSelect(sel, c.correct), hints.used), hintsUsed: hints.used, answer: sel.map((i) => i + 1).join(', ') });
  return (
    <div>
      <p className="mb-1 text-xs text-muted">{c.doc}</p>
      <p className="mb-3 text-sm font-semibold">{c.prompt}</p>
      <Sentences text={c.text} selected={sel} onToggle={toggle} locked={ctx.locked} correct={c.correct} />
      <p className="mt-2 text-xs text-muted" aria-live="polite">Seleccionadas: {sel.length} de {c.maxSelect}</p>
      <HintBox hints={c.hints} used={hints.used} onReveal={hints.reveal} locked={ctx.locked} cost={`−${HINT_PENALTY} pts`} />
      {!ctx.locked && <button type="button" className="btn-primary mt-4" onClick={submit} disabled={sel.length === 0}>Entregar deducción</button>}
    </div>
  );
}

function ClassifyView({ c, ctx }: { c: ClassifyChallenge; ctx: RenderCtx }) {
  const [val, setVal] = useState<Record<string, string>>({});
  const hints = useHints(c.hints.length);
  const solution = Object.fromEntries(c.items.map((i) => [i.id, i.answer]));
  const ready = c.items.every((i) => val[i.id]);
  return (
    <div>
      <p className="mb-1 text-xs text-muted">{c.doc}</p>
      <p className="reading mb-3 text-sm">{c.intro}</p>
      <ClassifyBoard items={c.items} categories={c.categories} value={val} onChange={setVal} locked={ctx.locked} solution={solution} legend={c.prompt} />
      <HintBox hints={c.hints} used={hints.used} onReveal={hints.reveal} locked={ctx.locked} cost={`−${HINT_PENALTY} pts`} />
      {!ctx.locked && <button type="button" className="btn-primary mt-4" disabled={!ready} onClick={() => ctx.resolve({ score: applyHintPenalty(classifyScore(val, solution), hints.used), hintsUsed: hints.used })}>Entregar clasificación</button>}
    </div>
  );
}

function InferenceView({ c, ctx }: { c: InferenceChallenge; ctx: RenderCtx }) {
  const [opt, setOpt] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const hints = useHints(c.hints.length);
  return (
    <div>
      <p className="mb-1 text-xs text-muted">{c.doc}</p>
      <p className="mb-3 text-sm font-semibold">{c.prompt}</p>
      <Sentences text={c.text} selected={sent === null ? [] : [sent]} onToggle={(i) => setSent(i)} locked={ctx.locked} evidence={c.evidence} />
      <div role="radiogroup" aria-label="Conclusiones posibles" className="mt-4 space-y-2">
        {c.options.map((o) => {
          const active = opt === o.id;
          const right = ctx.locked && o.id === c.correctOption;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={active} disabled={ctx.locked} onClick={() => setOpt(o.id)} className={`kbd-tile block w-full ${active ? '!border-brand !bg-brand/15' : ''} ${right ? '!border-good' : ''}`}>
              {active && <Check className="mr-1 inline h-4 w-4" aria-hidden="true" />}{o.text}{right && <span className="ml-2 text-xs font-bold text-good">(conclusión correcta)</span>}
            </button>
          );
        })}
      </div>
      <HintBox hints={c.hints} used={hints.used} onReveal={hints.reveal} locked={ctx.locked} cost={`−${HINT_PENALTY} pts`} />
      {!ctx.locked && (
        <button type="button" className="btn-primary mt-4" disabled={!opt || sent === null} onClick={() => ctx.resolve({ score: applyHintPenalty(scoreInference(c, opt, sent), hints.used), hintsUsed: hints.used })}>
          Entregar deducción
        </button>
      )}
    </div>
  );
}

function EntreLineas(props: GameRuntimeProps) {
  const [challenges] = useState(() => pickChallenges(LECTURA_CHALLENGES, props.difficulty, props.focusSkill, props.unlockedMax));
  return (
    <ChallengeRunner
      challenges={challenges}
      report={props.report}
      setProgress={props.setProgress}
      finish={props.finish}
      paused={props.paused}
      render={(c, ctx) => (c.kind === 'select' ? <SelectView c={c} ctx={ctx} /> : c.kind === 'classify' ? <ClassifyView c={c} ctx={ctx} /> : <InferenceView c={c} ctx={ctx} />)}
    />
  );
}

export const entreLineas: GameModule = { meta: gameById('entre-lineas')!, Component: EntreLineas };
export { flatten };
