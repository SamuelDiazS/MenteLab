import type { Achievement, Progress } from '../types';
import { currentStreak } from '../utils/dates';
import { levelFromXp } from '../utils/levels';
import { PASS_THRESHOLD } from '../config';
import { GAME_IDS } from './games';
import { aggregateByPrefix, totalCompleted } from '../utils/stats';

const mastery = (prefix: string) => (p: Progress) => {
  const a = aggregateByPrefix(p, prefix);
  return a.attempts >= 8 && a.points / a.attempts >= 0.75;
};

const improved = (p: Progress) => {
  const groups = new Map<string, number[]>();
  for (const s of p.sessions) {
    if (s.status !== 'completed') continue;
    const k = `${s.gameId}:${s.difficulty}`;
    groups.set(k, [...(groups.get(k) ?? []), s.score]);
  }
  for (const scores of groups.values()) {
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] - Math.max(...scores.slice(0, i)) >= 10) return true;
    }
  }
  return false;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primera-victoria', name: 'Primera victoria', description: 'Supera una partida con al menos 60 puntos.', icon: 'trophy', xp: 20, check: (p) => p.sessions.some((s) => s.status === 'completed' && s.score >= PASS_THRESHOLD) },
  { id: 'cinco-partidas', name: 'Cinco partidas', description: 'Completa cinco partidas.', icon: 'gamepad', xp: 30, check: (p) => totalCompleted(p) >= 5 },
  { id: 'experto-deduccion', name: 'Experto en deducción', description: 'Resuelve 8 desafíos lógicos con más de 75 % de precisión.', icon: 'cpu', xp: 50, check: mastery('logica') },
  { id: 'lector-analitico', name: 'Lector analítico', description: 'Resuelve 8 casos de lectura con más de 75 % de precisión.', icon: 'search', xp: 50, check: mastery('lectura') },
  { id: 'resolucion-matematica', name: 'Resolución matemática', description: 'Resuelve 8 desafíos numéricos con más de 75 % de precisión.', icon: 'flask-conical', xp: 50, check: mastery('matematicas') },
  { id: 'cientifico-experimental', name: 'Científico experimental', description: 'Completa 8 desafíos de ciencias con más de 75 % de precisión.', icon: 'leaf', xp: 50, check: mastery('ciencias') },
  { id: 'ciudadano-activo', name: 'Ciudadano activo', description: 'Completa 8 desafíos de sociales con más de 75 % de precisión.', icon: 'landmark', xp: 50, check: mastery('sociales') },
  { id: 'explorador-idiomas', name: 'Explorador de idiomas', description: 'Supera 8 escenas en inglés con más de 75 % de precisión.', icon: 'compass', xp: 50, check: mastery('ingles') },
  { id: 'sin-pistas', name: 'Mente limpia', description: 'Termina una partida con 90 puntos o más sin usar pistas.', icon: 'sparkles', xp: 40, check: (p) => p.sessions.some((s) => s.status === 'completed' && s.score >= 90 && s.records.every((r) => r.hintsUsed === 0)) },
  { id: 'todo-terreno', name: 'Todo terreno', description: 'Completa al menos una partida en cada uno de los seis juegos.', icon: 'layers', xp: 60, check: (p) => GAME_IDS.every((g) => (p.gameStats[g]?.completed ?? 0) > 0) },
  { id: 'nivel-avanzado', name: 'Nivel avanzado', description: 'Supera el tercer nivel de cualquier juego.', icon: 'mountain', xp: 60, check: (p) => Object.values(p.cleared).some((c) => c.includes(3)) },
  { id: 'mejora-continua', name: 'Mejora continua', description: 'Mejora tu puntaje en un nivel en 10 puntos o más respecto a tu mejor marca previa.', icon: 'trending-up', xp: 40, check: improved },
  { id: 'constancia', name: 'Constancia', description: 'Completa partidas en tres días seguidos.', icon: 'flame', xp: 30, check: (p) => currentStreak(p.trainingDays) >= 3 },
  { id: 'nivel-5', name: 'Nivel 5', description: 'Alcanza el nivel 5 de experiencia.', icon: 'star', xp: 0, check: (p) => levelFromXp(p.xp).level >= 5 },
];

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
