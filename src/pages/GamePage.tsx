import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, DoorOpen, Lock, Pause, Play } from 'lucide-react';
import { competencyById, skillById } from '../data/competencies';
import { getGameModule } from '../games/registry';
import { ResultsScreen, type SessionResult } from '../games/shared/ResultsScreen';
import { Icon } from '../components/Icon';
import { ConfirmDialog, EmptyState, ProgressBar } from '../components/ui';
import { useStopwatch } from '../hooks/useStopwatch';
import { useProgress } from '../store/ProgressContext';
import type { ChallengeRecord, Difficulty, Session } from '../types';
import { formatClock } from '../utils/dates';
import { sessionAccuracy, sessionScore, sessionXp } from '../utils/scoring';
import { bestScore, unlockedMax } from '../utils/stats';
import { PASS_THRESHOLD } from '../config';

type Phase = 'intro' | 'playing' | 'results';
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function GamePage() {
  const { gameId = '' } = useParams();
  const mod = getGameModule(gameId);
  if (!mod) {
    return <EmptyState page title="Este juego no existe" text="El enlace no corresponde a ningún minijuego del catálogo." action={<Link to="/juegos" className="btn-primary">Ir al catálogo</Link>} />;
  }
  return <GameFlow key={gameId} gameId={gameId} />;
}

function GameFlow({ gameId }: { gameId: string }) {
  const mod = getGameModule(gameId)!;
  const { meta, Component } = mod;
  const comp = competencyById(meta.competency);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { progress, startSession, recordChallenge, finishSession, abandonSession } = useProgress();
  const max = unlockedMax(progress, meta.id);

  const focusParam = params.get('foco') ?? undefined;
  const focusSkill = focusParam && skillById(focusParam)?.game === meta.id ? focusParam : undefined;
  const levelParam = Number(params.get('nivel'));
  const [difficulty, setDifficulty] = useState<Difficulty>(([1, 2, 3].includes(levelParam) && levelParam <= max ? levelParam : max) as Difficulty);
  const [phase, setPhase] = useState<Phase>('intro');
  const [tutorial, setTutorial] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const recordsRef = useRef<ChallengeRecord[]>([]);
  const watch = useStopwatch(paused || confirmExit || phase !== 'playing');
  const playing = phase === 'playing';

  // confirmación al intentar salir (enlaces, atrás del navegador) con una partida en curso
  const playingRef = useRef(false);
  playingRef.current = playing;
  const blocker = useBlocker(() => playingRef.current);
  useEffect(() => {
    if (blocker.state === 'blocked') setConfirmExit(true);
  }, [blocker.state]);
  useEffect(() => {
    if (!playing) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [playing]);

  const start = () => {
    const s: Session = {
      id: newId(), gameId: meta.id, difficulty, mode: focusSkill ? 'refuerzo' : 'nivel', focusSkill,
      status: 'started', startedAt: Date.now(), durationSec: 0, records: [], score: 0, accuracy: 0, xpEarned: 0,
    };
    sessionRef.current = s;
    recordsRef.current = [];
    startSession(s);
    watch.reset();
    setDone(0); setTotal(0); setPaused(false); setResult(null);
    setRunKey((k) => k + 1);
    setPhase('playing');
  };

  const report = useCallback((r: ChallengeRecord) => {
    recordsRef.current = [...recordsRef.current, r];
    if (sessionRef.current) recordChallenge(sessionRef.current.id, r);
  }, [recordChallenge]);

  const setProgressCb = useCallback((d: number, t: number) => { setDone(d); setTotal(t); }, []);

  const finish = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    const records = recordsRef.current;
    const score = sessionScore(records, meta);
    const accuracy = sessionAccuracy(records);
    const xp = sessionXp(score, s.difficulty, records.length);
    const durationSec = watch.read();
    const { unlocked, levelCleared } = finishSession(s.id, { durationSec, score, accuracy, xp });
    sessionRef.current = null; // la partida ya no está en curso
    setResult({ score, accuracy, xp, durationSec, records, unlocked, levelCleared, difficulty: s.difficulty, nextUnlocked: score >= PASS_THRESHOLD && s.mode === 'nivel' && s.difficulty < 3 });
    setPhase('results');
  }, [finishSession, meta, watch]);

  const abandon = () => {
    const s = sessionRef.current;
    if (s) abandonSession(s.id, watch.read());
    sessionRef.current = null;
    playingRef.current = false;
    setConfirmExit(false);
    setPhase('intro');
    if (blocker.state === 'blocked') blocker.proceed();
    else navigate('/juegos');
  };
  const stay = () => { setConfirmExit(false); if (blocker.state === 'blocked') blocker.reset(); };

  // el bloqueo se levanta en cuanto la fase deja de ser «playing», pero el efecto de salida lo resuelve React Router
  const cleared = progress.cleared[meta.id] ?? [];

  if (phase === 'results' && result) {
    return <ResultsScreen game={meta} result={result} onRetry={start} onNextLevel={() => { setDifficulty(Math.min(3, result.difficulty + 1) as Difficulty); setPhase('intro'); }} />;
  }

  if (phase === 'playing') {
    return (
      <div>
        <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: `rgb(var(--${comp.token}) / .2)`, color: `rgb(var(--${comp.token}))` }}><Icon name={meta.icon} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{meta.name} <span className="font-normal text-muted">· {meta.levelNames[difficulty - 1]}{focusSkill ? ' · refuerzo' : ''}</span></p>
              <ProgressBar value={total ? done / total : 0} label="Progreso de la partida" tone={`bg-${comp.token}`} />
            </div>
            {progress.settings.showTimer && <span className="chip tabular-nums" aria-label="Tiempo activo"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{formatClock(watch.sec)}</span>}
            <button type="button" className="btn-ghost !min-h-[40px]" onClick={() => setPaused(true)} aria-label="Pausar"><Pause className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" className="btn-ghost !min-h-[40px]" onClick={() => setConfirmExit(true)} aria-label="Salir de la partida"><DoorOpen className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </div>
        <div className="mx-auto max-w-4xl">
          {paused ? (
            <div className="card-pad text-center" role="status">
              <h2 className="text-2xl font-bold">Partida en pausa</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">El cronómetro está detenido y el contenido oculto. Cuando quieras, continúa donde lo dejaste.</p>
              <button type="button" className="btn-primary mt-4" onClick={() => setPaused(false)} data-autofocus><Play className="h-4 w-4" aria-hidden="true" />Continuar</button>
            </div>
          ) : (
            <Component key={runKey} difficulty={difficulty} focusSkill={focusSkill} unlockedMax={max} paused={paused} report={report} setProgress={setProgressCb} finish={finish} />
          )}
        </div>
        <ConfirmDialog open={confirmExit} title="¿Salir de la partida?" danger confirmLabel="Salir y abandonar" cancelLabel="Seguir jugando" onConfirm={abandon} onCancel={stay}
          message="Si sales ahora, la partida se registrará como abandonada. Lo que ya resolviste queda guardado en tus estadísticas, pero no obtendrás experiencia por esta partida." />
      </div>
    );
  }

  // ───── Pantalla inicial ─────
  const step = meta.tutorial[tutorial];
  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/juegos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al catálogo</Link>
      <header className="card-pad" style={{ borderColor: `rgb(var(--${comp.token}) / .5)` }}>
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: `rgb(var(--${comp.token}) / .2)`, color: `rgb(var(--${comp.token}))` }}><Icon name={meta.icon} className="h-8 w-8" /></span>
          <div>
            <p className="text-sm font-semibold" style={{ color: `rgb(var(--${comp.token}))` }}>{comp.name} · {meta.genre}</p>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{meta.name}</h1>
            <p className="mt-1 text-muted">{meta.tagline}</p>
          </div>
        </div>
        <p className="reading mt-4 text-sm">{meta.mechanic}</p>
        {focusSkill && <p className="mt-3 rounded-xl bg-brand/15 p-3 text-sm"><strong>Sesión de refuerzo:</strong> practicarás «{skillById(focusSkill)?.label}». Esta partida da experiencia pero no cuenta para superar niveles.</p>}
      </header>

      <section className="mt-5" aria-labelledby="lvl-title">
        <h2 id="lvl-title" className="mb-3 text-xl font-bold">Elige el nivel</h2>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Nivel">
          {([1, 2, 3] as Difficulty[]).map((d) => {
            const locked = d > max;
            const best = progress.best[`${meta.id}:${d}`];
            const active = difficulty === d;
            return (
              <button key={d} type="button" role="radio" aria-checked={active} disabled={locked} onClick={() => setDifficulty(d)}
                className={`card p-4 text-left transition-colors ${active ? '!border-brand ring-2 ring-brand/40' : ''} ${locked ? 'opacity-60' : 'hover:bg-raised'}`}>
                <p className="flex items-center justify-between text-sm font-bold">Nivel {d} · {meta.levelNames[d - 1]}{locked && <Lock className="h-4 w-4" aria-label="Bloqueado" />}</p>
                <p className="mt-1 text-xs text-muted">
                  {locked ? `Se abre al superar el nivel ${d - 1} con ${PASS_THRESHOLD} puntos o más.` : cleared.includes(d) ? `Superado · mejor puntaje ${best ?? '—'}` : best ? `Mejor puntaje ${best}` : 'Sin jugar todavía'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-pad mt-5" aria-labelledby="tut-title" aria-live="polite">
        <h2 id="tut-title" className="text-xl font-bold">Cómo se juega</h2>
        <div className="mt-3 rounded-xl bg-raised/40 p-4">
          <p className="font-display text-lg font-bold">{tutorial + 1}. {step.title}</p>
          <p className="reading mt-1 text-sm text-muted">{step.text}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button type="button" className="btn-ghost" onClick={() => setTutorial((t) => Math.max(0, t - 1))} disabled={tutorial === 0}>Anterior</button>
          <span className="text-xs text-muted">{tutorial + 1} de {meta.tutorial.length}</span>
          <button type="button" className="btn-ghost" onClick={() => setTutorial((t) => Math.min(meta.tutorial.length - 1, t + 1))} disabled={tutorial === meta.tutorial.length - 1}>Siguiente</button>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary !px-6" onClick={start} data-autofocus><Play className="h-4 w-4" aria-hidden="true" />Comenzar</button>
        {bestScore(progress, meta.id) !== null && <span className="text-sm text-muted">Tu mejor puntaje en este juego: <strong className="text-ink">{bestScore(progress, meta.id)}</strong></span>}
      </div>
    </div>
  );
}
