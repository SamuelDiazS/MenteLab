import { MAX_SESSIONS_STORED, PASS_THRESHOLD } from '../config';
import { ACHIEVEMENTS } from '../data/achievements';
import type { Achievement, ChallengeRecord, Difficulty, Progress, Session } from '../types';
import { dayKey } from '../utils/dates';

const withSession = (p: Progress, id: string, fn: (s: Session) => Session): Progress => ({
  ...p,
  sessions: p.sessions.map((s) => (s.id === id ? fn(s) : s)),
});

export function startSession(p: Progress, session: Session): Progress {
  const g = p.gameStats[session.gameId] ?? { started: 0, completed: 0, abandoned: 0, scoreSum: 0, seconds: 0 };
  return {
    ...p,
    sessions: [...p.sessions, session].slice(-MAX_SESSIONS_STORED),
    gameStats: { ...p.gameStats, [session.gameId]: { ...g, started: g.started + 1 } },
  };
}

/** Guarda cada desafío en cuanto se resuelve (guardado automático a mitad de partida). */
export function recordChallenge(p: Progress, sessionId: string, r: ChallengeRecord): Progress {
  const { explanation: _e, answer: _a, ...stored } = r;
  void _e;
  void _a;
  const prev = p.skillStats[r.skill] ?? { attempts: 0, points: 0, hints: 0, timeSec: 0, recent: [] };
  const next = {
    attempts: prev.attempts + 1,
    points: prev.points + r.score / 100,
    hints: prev.hints + r.hintsUsed,
    timeSec: prev.timeSec + r.timeSec,
    recent: [...prev.recent, r.score / 100].slice(-12),
  };
  const withRec = withSession(p, sessionId, (s) => ({ ...s, records: [...s.records, stored] }));
  return { ...withRec, skillStats: { ...withRec.skillStats, [r.skill]: next } };
}

export function abandonSession(p: Progress, sessionId: string, durationSec: number): Progress {
  const s = p.sessions.find((x) => x.id === sessionId);
  if (!s || s.status !== 'started') return p;
  const g = p.gameStats[s.gameId] ?? { started: 1, completed: 0, abandoned: 0, scoreSum: 0, seconds: 0 };
  const done = withSession(p, sessionId, (x) => ({ ...x, status: 'abandoned', endedAt: Date.now(), durationSec }));
  return {
    ...done,
    totalSeconds: done.totalSeconds + durationSec,
    gameStats: { ...done.gameStats, [s.gameId]: { ...g, abandoned: g.abandoned + 1, seconds: g.seconds + durationSec } },
  };
}

export interface FinishInput {
  durationSec: number;
  score: number;
  accuracy: number;
  xp: number;
}

export function finishSession(p: Progress, sessionId: string, input: FinishInput): { progress: Progress; unlocked: Achievement[]; levelCleared: boolean } {
  const s = p.sessions.find((x) => x.id === sessionId);
  if (!s || s.status !== 'started') return { progress: p, unlocked: [], levelCleared: false };
  const key = `${s.gameId}:${s.difficulty}`;
  const g = p.gameStats[s.gameId] ?? { started: 1, completed: 0, abandoned: 0, scoreSum: 0, seconds: 0 };
  const passed = input.score >= PASS_THRESHOLD;
  const cleared = new Set<Difficulty>(p.cleared[s.gameId] ?? []);
  // solo las partidas de nivel completo abren el siguiente; el refuerzo suma práctica y XP
  const levelCleared = passed && s.mode === 'nivel' && !cleared.has(s.difficulty);
  if (passed && s.mode === 'nivel') cleared.add(s.difficulty);
  const day = dayKey();

  let next: Progress = withSession(p, sessionId, (x) => ({
    ...x,
    status: 'completed',
    endedAt: Date.now(),
    durationSec: input.durationSec,
    score: input.score,
    accuracy: input.accuracy,
    xpEarned: input.xp,
  }));
  next = {
    ...next,
    xp: next.xp + input.xp,
    totalSeconds: next.totalSeconds + input.durationSec,
    best: s.mode === 'nivel' ? { ...next.best, [key]: Math.max(next.best[key] ?? 0, input.score) } : next.best,
    cleared: { ...next.cleared, [s.gameId]: Array.from(cleared).sort() as Difficulty[] },
    gameStats: {
      ...next.gameStats,
      [s.gameId]: { ...g, completed: g.completed + 1, scoreSum: g.scoreSum + input.score, seconds: g.seconds + input.durationSec },
    },
    trainingDays: next.trainingDays.includes(day) ? next.trainingDays : [...next.trainingDays, day].slice(-400),
  };

  const unlocked: Achievement[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of ACHIEVEMENTS) {
      if (!next.achievements[a.id] && a.check(next)) {
        next = { ...next, xp: next.xp + a.xp, achievements: { ...next.achievements, [a.id]: Date.now() } };
        unlocked.push(a);
        changed = true;
      }
    }
  }
  return { progress: next, unlocked, levelCleared };
}
