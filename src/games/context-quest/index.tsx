import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, MessageSquare, Signpost } from 'lucide-react';
import { gameById } from '../../data/games';
import type { ChallengeRecord, GameModule, GameRuntimeProps } from '../../types';
import { useStopwatch } from '../../hooks/useStopwatch';
import { Feedback } from '../shared/Feedback';
import { CHAPTERS, mainSceneCount, type Chapter, type Option, type Scene } from './data';

const GLOSS_PENALTY = 10;

export function sceneScore(correct: boolean, glossUsed: boolean) {
  return correct ? 100 - (glossUsed ? GLOSS_PENALTY : 0) : 0;
}

function SceneBody({ s }: { s: Scene }) {
  if (s.kind === 'notice') {
    return (
      <div className="rounded-xl border-4 border-double border-warn bg-panel p-5 text-center" role="group" aria-label="Aviso">
        <p className="flex items-center justify-center gap-2 font-display text-lg font-extrabold tracking-wide"><Signpost className="h-5 w-5" aria-hidden="true" />{s.heading}</p>
        {s.lines.map((l, i) => <p key={i} lang="en" className="mt-2 text-sm">{l.text}</p>)}
      </div>
    );
  }
  if (s.kind === 'dialogue') {
    return (
      <div className="space-y-2" role="group" aria-label="Diálogo">
        {s.lines.map((l, i) => {
          const luisa = l.who === 'Luisa';
          return (
            <div key={i} className={`flex ${luisa ? 'justify-end' : ''}`}>
              <p lang="en" className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${luisa ? 'bg-c-ingles/25' : 'bg-raised'}`}>
                {l.who && <span className="mb-0.5 flex items-center gap-1 text-xs font-bold text-muted"><MessageSquare className="h-3 w-3" aria-hidden="true" />{l.who}</span>}{l.text}
              </p>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="card-pad !bg-raised/30" role="group" aria-label={s.kind === 'message' ? 'Mensaje' : 'Texto'}>
      {s.heading && <p className="mb-2 flex items-center gap-2 text-sm font-bold text-muted"><BookOpen className="h-4 w-4" aria-hidden="true" />{s.heading}</p>}
      {s.lines.map((l, i) => <p key={i} lang="en" className="reading text-[0.95rem]">{l.text}</p>)}
    </div>
  );
}

function ContextQuest({ difficulty, report, setProgress, finish, paused }: GameRuntimeProps) {
  const chapter: Chapter = CHAPTERS.find((c) => c.difficulty === difficulty) ?? CHAPTERS[0];
  const [sceneId, setSceneId] = useState(chapter.start);
  const [picked, setPicked] = useState<Option | null>(null);
  const [gloss, setGloss] = useState(false);
  const [score, setScore] = useState(0);
  const [playedMain, setPlayedMain] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [ending, setEnding] = useState(false);
  const watch = useStopwatch(paused || picked !== null);
  const reported = useRef(false);
  const scene = chapter.scenes.find((s) => s.id === sceneId)!;
  const total = mainSceneCount(chapter);

  useEffect(() => { setProgress(Math.min(total, playedMain + (picked && !scene.detour ? 1 : 0)), total); }, [playedMain, picked, scene.detour, total, setProgress]);

  const choose = (o: Option) => {
    if (picked || reported.current) return;
    reported.current = true;
    const sc = sceneScore(o.correct, gloss);
    const rec: ChallengeRecord = {
      challengeId: scene.id, skill: scene.skill, title: scene.title, score: sc, correct: o.correct,
      attempts: 1, hintsUsed: gloss ? 1 : 0, timeSec: watch.read(), explanation: scene.explanation, answer: o.text,
    };
    report(rec);
    setScore(sc);
    setResults((r) => [...r, sc]);
    setPicked(o);
  };

  const next = () => {
    if (!picked) return;
    if (!scene.detour) setPlayedMain((n) => n + 1);
    if (picked.next === null) { setEnding(true); return; }
    reported.current = false;
    watch.reset();
    setGloss(false);
    setPicked(null);
    setSceneId(picked.next);
  };

  if (ending) {
    const avg = results.reduce((a, b) => a + b, 0) / Math.max(1, results.length);
    const text = avg >= 85 ? chapter.endings.good : avg >= 55 ? chapter.endings.ok : chapter.endings.low;
    return (
      <div className="card-pad anim-rise text-center">
        <p className="text-sm font-semibold text-muted">{chapter.title}</p>
        <h2 className="mt-1 text-2xl font-bold">Final de la historia</h2>
        <p className="reading mx-auto mt-3 text-sm">{text}</p>
        <p className="mt-3 text-xs text-muted">Escenas jugadas: {results.length} · desvíos: {results.length - total > 0 ? results.length - total : 0}</p>
        <button type="button" className="btn-primary mt-5" onClick={finish} data-autofocus>Ver resultados</button>
      </div>
    );
  }

  const lastScene = picked?.next === null;
  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <span className="chip">{chapter.title} · nivel {chapter.level}</span>
        {scene.detour && <span className="chip !text-warn">Desvío de la historia</span>}
      </header>
      {sceneId === chapter.start && !picked && <p className="reading mb-4 rounded-xl bg-brand/10 p-3 text-sm">{chapter.intro}</p>}
      <h2 className="font-display text-2xl font-bold" lang="en">{scene.title}</h2>
      <p className="mb-3 mt-1 text-sm italic text-muted">{scene.setting}</p>
      <SceneBody s={scene} />

      <p className="mb-2 mt-5 font-semibold" lang="en">{scene.question}</p>
      <div role="radiogroup" aria-label="Opciones" className="space-y-2">
        {scene.options.map((o) => {
          const sel = picked?.id === o.id;
          const right = picked && o.correct;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={sel} disabled={picked !== null} lang="en" onClick={() => choose(o)}
              className={`kbd-tile block w-full ${sel ? '!border-brand !bg-brand/15' : ''} ${right ? '!border-good' : ''}`}>
              {sel && <Check className="mr-1 inline h-4 w-4" aria-hidden="true" />}{o.text}{right && <span className="ml-2 text-xs font-bold text-good" lang="es">(correcta)</span>}
            </button>
          );
        })}
      </div>

      {!picked && (
        <div className="mt-4 rounded-xl border border-line bg-raised/40 p-3">
          {gloss && (
            <ul className="mb-2 space-y-1 text-sm" aria-live="polite">{scene.gloss.map((g) => <li key={g.word}><strong lang="en">{g.word}</strong>: {g.meaning}</li>)}</ul>
          )}
          <button type="button" className="btn-ghost !min-h-[40px]" onClick={() => setGloss(true)} disabled={gloss}>{gloss ? 'Vocabulario mostrado' : `Ver vocabulario (−${GLOSS_PENALTY} pts)`}</button>
        </div>
      )}

      {picked && (
        <Feedback score={score} explanation={scene.explanation} onNext={next} last={false} nextLabel={lastScene ? 'Terminar la historia' : 'Continuar la historia'}>
          <p className="mt-3 rounded-xl bg-raised/50 p-3 text-sm"><strong>Lo que pasa en la historia:</strong> {picked.consequence}</p>
        </Feedback>
      )}
    </div>
  );
}

export const contextQuest: GameModule = { meta: gameById('context-quest')!, Component: ContextQuest };
