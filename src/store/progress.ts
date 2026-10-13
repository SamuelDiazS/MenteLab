import { MAX_SESSIONS_STORED, SCHEMA_VERSION, STORAGE_KEY } from '../config';
import { GAME_IDS } from '../data/games';
import type { ChallengeRecord, Difficulty, GameId, GameStat, Progress, Session, SkillStat } from '../types';
import { isValidDayKey } from '../utils/dates';

export const defaultProgress = (): Progress => ({
  schemaVersion: SCHEMA_VERSION,
  createdAt: Date.now(),
  xp: 0,
  sessions: [],
  skillStats: {},
  gameStats: {},
  best: {},
  cleared: {},
  achievements: {},
  trainingDays: [],
  totalSeconds: 0,
  settings: { theme: 'dark', showTimer: true },
});

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d = 0, lo = 0, hi = Number.MAX_SAFE_INTEGER) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
const str = (v: unknown, d = '') => (typeof v === 'string' ? v.slice(0, 200) : d);
const isDifficulty = (v: unknown): v is Difficulty => v === 1 || v === 2 || v === 3;
const isGameId = (v: unknown): v is GameId => typeof v === 'string' && (GAME_IDS as string[]).includes(v);

function sanitizeRecord(v: unknown): ChallengeRecord | null {
  if (!isObj(v) || typeof v.challengeId !== 'string' || typeof v.skill !== 'string') return null;
  return {
    challengeId: str(v.challengeId),
    skill: str(v.skill),
    title: str(v.title, 'Desafío'),
    score: num(v.score, 0, 0, 100),
    correct: v.correct === true,
    attempts: num(v.attempts, 1, 0, 99),
    hintsUsed: num(v.hintsUsed, 0, 0, 99),
    timeSec: num(v.timeSec, 0, 0, 86400),
  };
}

function sanitizeSession(v: unknown): Session | null {
  if (!isObj(v) || !isGameId(v.gameId) || !isDifficulty(v.difficulty) || typeof v.id !== 'string') return null;
  let status: Session['status'] = v.status === 'completed' ? 'completed' : 'abandoned';
  // una partida «iniciada» que sigue guardada al cargar quedó interrumpida: se trata como abandonada
  const records = Array.isArray(v.records) ? (v.records.map(sanitizeRecord).filter(Boolean) as ChallengeRecord[]) : [];
  return {
    id: str(v.id),
    gameId: v.gameId,
    difficulty: v.difficulty,
    mode: v.mode === 'refuerzo' ? 'refuerzo' : 'nivel',
    focusSkill: typeof v.focusSkill === 'string' ? v.focusSkill : undefined,
    status,
    startedAt: num(v.startedAt, Date.now()),
    endedAt: typeof v.endedAt === 'number' ? v.endedAt : undefined,
    durationSec: num(v.durationSec, 0, 0, 86400),
    records,
    score: num(v.score, 0, 0, 100),
    accuracy: num(v.accuracy, 0, 0, 1),
    xpEarned: num(v.xpEarned, 0),
  };
}

function sanitizeSkillStat(v: unknown): SkillStat | null {
  if (!isObj(v)) return null;
  return {
    attempts: num(v.attempts),
    points: num(v.points),
    hints: num(v.hints),
    timeSec: num(v.timeSec),
    recent: Array.isArray(v.recent) ? v.recent.filter((n): n is number => typeof n === 'number' && n >= 0 && n <= 1).slice(-12) : [],
  };
}

function sanitizeGameStat(v: unknown): GameStat | null {
  if (!isObj(v)) return null;
  return { started: num(v.started), completed: num(v.completed), abandoned: num(v.abandoned), scoreSum: num(v.scoreSum), seconds: num(v.seconds) };
}

/**
 * Valida y sanea un objeto desconocido. Devuelve null si no tiene la forma de un progreso.
 * Los campos inválidos se reemplazan por valores predeterminados sin romper el resto.
 */
export function validateProgress(raw: unknown): Progress | null {
  if (!isObj(raw)) return null;
  if (typeof raw.schemaVersion !== 'number' || raw.schemaVersion < 1 || raw.schemaVersion > SCHEMA_VERSION) return null;
  const base = defaultProgress();

  const sessions = Array.isArray(raw.sessions)
    ? (raw.sessions.map(sanitizeSession).filter(Boolean) as Session[]).slice(-MAX_SESSIONS_STORED)
    : [];

  const skillStats: Progress['skillStats'] = {};
  if (isObj(raw.skillStats)) {
    for (const [k, v] of Object.entries(raw.skillStats)) {
      const s = sanitizeSkillStat(v);
      if (s) skillStats[k.slice(0, 80)] = s;
    }
  }
  const gameStats: Progress['gameStats'] = {};
  if (isObj(raw.gameStats)) {
    for (const [k, v] of Object.entries(raw.gameStats)) {
      const s = sanitizeGameStat(v);
      if (s && isGameId(k)) gameStats[k] = s;
    }
  }
  // las partidas que quedaron «iniciadas» (pestaña cerrada a mitad de juego) pasan a abandonadas
  if (Array.isArray(raw.sessions)) {
    for (const s of raw.sessions) {
      if (isObj(s) && s.status === 'started' && isGameId(s.gameId)) {
        const g = gameStats[s.gameId] ?? { started: 1, completed: 0, abandoned: 0, scoreSum: 0, seconds: 0 };
        g.abandoned += 1;
        gameStats[s.gameId] = g;
      }
    }
  }

  const best: Progress['best'] = {};
  if (isObj(raw.best)) for (const [k, v] of Object.entries(raw.best)) if (typeof v === 'number') best[k.slice(0, 60)] = num(v, 0, 0, 100);

  const cleared: Progress['cleared'] = {};
  if (isObj(raw.cleared)) {
    for (const [k, v] of Object.entries(raw.cleared)) {
      if (isGameId(k) && Array.isArray(v)) cleared[k] = Array.from(new Set(v.filter(isDifficulty))).sort() as Difficulty[];
    }
  }
  const achievements: Progress['achievements'] = {};
  if (isObj(raw.achievements)) for (const [k, v] of Object.entries(raw.achievements)) if (typeof v === 'number') achievements[k.slice(0, 60)] = v;

  const settings = isObj(raw.settings)
    ? { theme: raw.settings.theme === 'light' ? ('light' as const) : ('dark' as const), showTimer: raw.settings.showTimer !== false }
    : base.settings;

  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: num(raw.createdAt, base.createdAt),
    xp: num(raw.xp),
    sessions,
    skillStats,
    gameStats,
    best,
    cleared,
    achievements,
    trainingDays: Array.isArray(raw.trainingDays) ? Array.from(new Set(raw.trainingDays.filter(isValidDayKey))).sort().slice(-400) : [],
    totalSeconds: num(raw.totalSeconds),
    settings,
  };
}

export type LoadResult = { progress: Progress; status: 'ok' | 'empty' | 'corrupt' | 'unavailable' };

export function loadProgress(): LoadResult {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return { progress: defaultProgress(), status: 'empty' };
    const parsed = validateProgress(JSON.parse(text));
    if (!parsed) return { progress: defaultProgress(), status: 'corrupt' };
    return { progress: parsed, status: 'ok' };
  } catch (e) {
    const unavailable = e instanceof DOMException;
    return { progress: defaultProgress(), status: unavailable ? 'unavailable' : 'corrupt' };
  }
}

export function saveProgress(p: Progress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export function exportProgress(p: Progress): string {
  return JSON.stringify({ app: 'mentelab', exportedAt: new Date().toISOString(), ...p }, null, 2);
}

export function importProgress(text: string): { ok: true; progress: Progress } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  const p = validateProgress(data);
  if (!p) return { ok: false, error: 'El archivo no parece una copia de progreso de la plataforma o es de una versión no compatible.' };
  return { ok: true, progress: p };
}
