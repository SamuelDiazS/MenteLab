import type { ComponentType } from 'react';

export type CompetencyId = 'lectura' | 'logica' | 'matematicas' | 'ciencias' | 'sociales' | 'ingles';
export type GameId =
  | 'entre-lineas'
  | 'protocolo-logico'
  | 'laboratorio-numerico'
  | 'ecosistema-404'
  | 'ciudad-en-equilibrio'
  | 'context-quest';
export type Difficulty = 1 | 2 | 3;
export type SkillId = string; // formato "competencia.habilidad"

export interface Competency {
  id: CompetencyId;
  name: string;
  short: string;
  /** Clase de Tailwind sin prefijo, p. ej. "c-lectura" */
  token: string;
  description: string;
}

export interface Skill {
  id: SkillId;
  label: string;
  game: GameId;
  /** Texto que se usa en las recomendaciones */
  practice: string;
}

export interface GameMeta {
  id: GameId;
  name: string;
  competency: CompetencyId;
  genre: string;
  tagline: string;
  mechanic: string;
  icon: string;
  /** Dificultad base del juego (1 accesible · 3 exigente) */
  baseDifficulty: Difficulty;
  /** Peso del tiempo en el puntaje (0 = solo cuenta la precisión) */
  speedWeight: number;
  /** Tiempo de referencia por desafío, en segundos */
  parSeconds: number;
  tutorial: { title: string; text: string }[];
  levelNames: [string, string, string];
}

export interface ChallengeRecord {
  challengeId: string;
  skill: SkillId;
  title: string;
  score: number; // 0-100
  correct: boolean;
  attempts: number;
  hintsUsed: number;
  timeSec: number;
  explanation?: string;
  answer?: string;
}

export type SessionStatus = 'started' | 'completed' | 'abandoned';

export interface Session {
  id: string;
  gameId: GameId;
  difficulty: Difficulty;
  mode: 'nivel' | 'refuerzo';
  focusSkill?: SkillId;
  status: SessionStatus;
  startedAt: number;
  endedAt?: number;
  durationSec: number;
  records: ChallengeRecord[];
  score: number;
  accuracy: number; // 0-1
  xpEarned: number;
}

export interface SkillStat {
  attempts: number;
  points: number; // suma de score/100
  hints: number;
  timeSec: number;
  /** últimos resultados (0-1) para ver tendencia */
  recent: number[];
}

export interface GameStat {
  started: number;
  completed: number;
  abandoned: number;
  scoreSum: number;
  seconds: number;
}

export interface Settings {
  theme: 'dark' | 'light';
  showTimer: boolean;
}

export interface Progress {
  schemaVersion: number;
  createdAt: number;
  xp: number;
  sessions: Session[];
  skillStats: Record<SkillId, SkillStat>;
  gameStats: Record<string, GameStat>;
  best: Record<string, number>; // `${gameId}:${difficulty}`
  cleared: Record<string, Difficulty[]>;
  achievements: Record<string, number>;
  trainingDays: string[];
  totalSeconds: number;
  settings: Settings;
}

export interface GameRuntimeProps {
  difficulty: Difficulty;
  focusSkill?: SkillId;
  unlockedMax: Difficulty;
  paused: boolean;
  report: (record: ChallengeRecord) => void;
  setProgress: (done: number, total: number) => void;
  finish: () => void;
}

export interface GameModule {
  meta: GameMeta;
  Component: ComponentType<GameRuntimeProps>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  check: (p: Progress) => boolean;
}
