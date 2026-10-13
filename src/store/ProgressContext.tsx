import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Achievement, ChallengeRecord, Progress, Session } from '../types';
import { abandonSession, finishSession, recordChallenge, startSession, type FinishInput } from './actions';
import { defaultProgress, loadProgress, saveProgress, type LoadResult } from './progress';

interface Ctx {
  progress: Progress;
  loadStatus: LoadResult['status'];
  saveFailed: boolean;
  dismissLoadNotice: () => void;
  startSession: (s: Session) => void;
  recordChallenge: (sessionId: string, r: ChallengeRecord) => void;
  finishSession: (sessionId: string, input: FinishInput) => { unlocked: Achievement[]; levelCleared: boolean };
  abandonSession: (sessionId: string, durationSec: number) => void;
  replace: (p: Progress) => void;
  reset: () => void;
  updateSettings: (patch: Partial<Progress['settings']>) => void;
}

const ProgressCtx = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const initial = useRef<LoadResult>();
  if (!initial.current) initial.current = loadProgress();
  const [progress, setProgress] = useState<Progress>(initial.current.progress);
  const [loadStatus, setLoadStatus] = useState<LoadResult['status']>(initial.current.status);
  const [saveFailed, setSaveFailed] = useState(false);
  const ref = useRef(progress);

  const commit = useCallback((fn: (p: Progress) => Progress) => {
    const next = fn(ref.current);
    ref.current = next;
    setProgress(next);
    // guardado inmediato: no se pierde nada si se cierra la pestaña
    setSaveFailed(!saveProgress(next));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = progress.settings.theme;
  }, [progress.settings.theme]);

  // al abrir la app, se persiste la versión saneada (p. ej. partidas interrumpidas)
  useEffect(() => {
    if (initial.current?.status === 'ok') saveProgress(ref.current);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      progress,
      loadStatus,
      saveFailed,
      dismissLoadNotice: () => setLoadStatus('ok'),
      startSession: (s) => commit((p) => startSession(p, s)),
      recordChallenge: (id, r) => commit((p) => recordChallenge(p, id, r)),
      finishSession: (id, input) => {
        const res = finishSession(ref.current, id, input);
        commit(() => res.progress);
        return { unlocked: res.unlocked, levelCleared: res.levelCleared };
      },
      abandonSession: (id, sec) => commit((p) => abandonSession(p, id, sec)),
      replace: (p) => commit(() => p),
      reset: () => commit(() => ({ ...defaultProgress(), settings: ref.current.settings })),
      updateSettings: (patch) => commit((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    }),
    [progress, loadStatus, saveFailed, commit],
  );

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useProgress(): Ctx {
  const c = useContext(ProgressCtx);
  if (!c) throw new Error('useProgress debe usarse dentro de ProgressProvider');
  return c;
}
