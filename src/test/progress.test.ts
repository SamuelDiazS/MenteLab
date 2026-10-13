import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY } from '../config';
import { abandonSession, finishSession, recordChallenge, startSession } from '../store/actions';
import { defaultProgress, exportProgress, importProgress, loadProgress, saveProgress, validateProgress } from '../store/progress';
import type { ChallengeRecord, Progress, Session } from '../types';
import { recommend } from '../utils/recommend';
import { bestScore, gameStatus, unlockedMax } from '../utils/stats';

const session = (over: Partial<Session> = {}): Session => ({ id: 's1', gameId: 'entre-lineas', difficulty: 1, mode: 'nivel', status: 'started', startedAt: Date.now(), durationSec: 0, records: [], score: 0, accuracy: 0, xpEarned: 0, ...over });
const rec = (skill: string, score: number, hints = 0): ChallengeRecord => ({ challengeId: `c-${skill}-${score}`, skill, title: 't', score, correct: score >= 60, attempts: 1, hintsUsed: hints, timeSec: 20 });

function play(p: Progress, id: string, over: Partial<Session>, recs: ChallengeRecord[], score: number) {
  let q = startSession(p, session({ id, ...over }));
  for (const r of recs) q = recordChallenge(q, id, r);
  return finishSession(q, id, { durationSec: 90, score, accuracy: score / 100, xp: 20 });
}

describe('persistencia', () => {
  beforeEach(() => localStorage.clear());
  it('sin datos devuelve el progreso por defecto', () => {
    const r = loadProgress();
    expect(r.status).toBe('empty');
    expect(r.progress.xp).toBe(0);
  });
  it('guarda y recupera', () => {
    const p = { ...defaultProgress(), xp: 120 };
    expect(saveProgress(p)).toBe(true);
    const r = loadProgress();
    expect(r.status).toBe('ok');
    expect(r.progress.xp).toBe(120);
  });
  it('datos corruptos no bloquean la aplicación', () => {
    localStorage.setItem(STORAGE_KEY, '{no es json');
    expect(loadProgress().status).toBe('corrupt');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ hola: 1 }));
    expect(loadProgress().status).toBe('corrupt');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }));
    expect(loadProgress().status).toBe('corrupt');
  });
  it('sanea campos inválidos sin descartar todo', () => {
    const raw = { schemaVersion: 1, xp: -50, createdAt: 'x', sessions: [{ nope: true }, 5], skillStats: { 'a.b': { attempts: 'x', points: 2 } }, best: { k: 500, z: 'a' }, cleared: { 'entre-lineas': [1, 9, 2], zzz: [1] }, trainingDays: ['2026-10-01', 'mal', 3], achievements: { x: 'no' }, settings: { theme: 'rosa' } };
    const p = validateProgress(raw)!;
    expect(p.xp).toBe(0);
    expect(p.sessions).toEqual([]);
    expect(p.skillStats['a.b'].attempts).toBe(0);
    expect(p.best).toEqual({ k: 100 });
    expect(p.cleared).toEqual({ 'entre-lineas': [1, 2] });
    expect(p.trainingDays).toEqual(['2026-10-01']);
    expect(p.settings.theme).toBe('dark');
  });
  it('una partida que quedó «iniciada» se carga como abandonada', () => {
    const p = { ...defaultProgress() };
    const started = startSession(p, session());
    expect(started.sessions[0].status).toBe('started');
    const reloaded = validateProgress(JSON.parse(JSON.stringify(started)))!;
    expect(reloaded.sessions[0].status).toBe('abandoned');
    expect(reloaded.gameStats['entre-lineas'].abandoned).toBe(1);
  });
  it('exportar e importar conserva los datos y rechaza archivos inválidos', () => {
    const { progress } = play(defaultProgress(), 's1', {}, [rec('lectura.tesis', 80)], 80);
    const text = exportProgress(progress);
    const back = importProgress(text);
    expect(back.ok).toBe(true);
    if (back.ok) { expect(back.progress.xp).toBe(progress.xp); expect(back.progress.sessions).toHaveLength(1); }
    expect(importProgress('hola').ok).toBe(false);
    expect(importProgress('{"a":1}').ok).toBe(false);
  });
});

describe('sesiones de juego', () => {
  it('iniciada → completada actualiza estadísticas, mejor puntaje, XP y días de entrenamiento', () => {
    const { progress, levelCleared } = play(defaultProgress(), 's1', {}, [rec('lectura.tesis', 100), rec('lectura.evidencia', 60)], 80);
    expect(levelCleared).toBe(true);
    expect(progress.sessions[0].status).toBe('completed');
    expect(progress.gameStats['entre-lineas']).toMatchObject({ started: 1, completed: 1, abandoned: 0, scoreSum: 80 });
    expect(progress.best['entre-lineas:1']).toBe(80);
    expect(progress.cleared['entre-lineas']).toEqual([1]);
    expect(progress.xp).toBeGreaterThanOrEqual(20);
    expect(progress.trainingDays).toHaveLength(1);
    expect(progress.skillStats['lectura.tesis']).toMatchObject({ attempts: 1, points: 1 });
    expect(unlockedMax(progress, 'entre-lineas')).toBe(2);
    expect(bestScore(progress, 'entre-lineas')).toBe(80);
    expect(gameStatus(progress, 'entre-lineas')).toBe('en-progreso');
  });
  it('desbloquea «Primera victoria» y suma su XP; no repite logros', () => {
    const r1 = play(defaultProgress(), 's1', {}, [rec('lectura.tesis', 80)], 80);
    expect(r1.unlocked.map((a) => a.id)).toContain('primera-victoria');
    const r2 = play(r1.progress, 's2', {}, [rec('lectura.tesis', 80)], 80);
    expect(r2.unlocked.map((a) => a.id)).not.toContain('primera-victoria');
  });
  it('una partida bajo 60 no supera el nivel', () => {
    const { progress, levelCleared } = play(defaultProgress(), 's1', {}, [rec('lectura.tesis', 40)], 40);
    expect(levelCleared).toBe(false);
    expect(progress.cleared['entre-lineas'] ?? []).toEqual([]);
    expect(unlockedMax(progress, 'entre-lineas')).toBe(1);
  });
  it('el refuerzo da XP pero no supera niveles ni cambia récords', () => {
    const { progress } = play(defaultProgress(), 's1', { mode: 'refuerzo', focusSkill: 'lectura.tesis' }, [rec('lectura.tesis', 90)], 90);
    expect(progress.cleared['entre-lineas'] ?? []).toEqual([]);
    expect(progress.best['entre-lineas:1']).toBeUndefined();
    expect(progress.xp).toBeGreaterThan(0);
  });
  it('abandonar registra el estado y conserva lo ya resuelto, sin XP', () => {
    let p = startSession(defaultProgress(), session());
    p = recordChallenge(p, 's1', rec('lectura.tesis', 70));
    p = abandonSession(p, 's1', 30);
    expect(p.sessions[0].status).toBe('abandoned');
    expect(p.gameStats['entre-lineas']).toMatchObject({ started: 1, abandoned: 1, completed: 0 });
    expect(p.skillStats['lectura.tesis'].attempts).toBe(1);
    expect(p.xp).toBe(0);
    expect(p.totalSeconds).toBe(30);
    expect(abandonSession(p, 's1', 30)).toBe(p); // no se abandona dos veces
  });
  it('finishSession ignora sesiones que no están en curso', () => {
    const { progress } = play(defaultProgress(), 's1', {}, [rec('lectura.tesis', 80)], 80);
    const again = finishSession(progress, 's1', { durationSec: 1, score: 100, accuracy: 1, xp: 99 });
    expect(again.progress).toBe(progress);
  });
  it('«Mejora continua»: subir 10 puntos sobre el mejor previo', () => {
    let r = play(defaultProgress(), 's1', {}, [rec('lectura.tesis', 60)], 60);
    r = play(r.progress, 's2', {}, [rec('lectura.tesis', 80)], 80);
    expect(r.progress.achievements['mejora-continua']).toBeDefined();
  });
});

describe('entrenamiento personalizado', () => {
  it('con pocos datos no inventa un perfil', () => {
    const r = recommend(play(defaultProgress(), 's1', {}, [rec('lectura.tesis', 50)], 50).progress);
    expect(r.status).toBe('insufficient');
    if (r.status === 'insufficient') expect(r.completed).toBe(1);
  });
  it('recomienda reforzar la habilidad con menor precisión', () => {
    let p = defaultProgress();
    p = play(p, 's1', {}, [rec('lectura.inferencia', 20), rec('lectura.tesis', 100)], 60).progress;
    p = play(p, 's2', {}, [rec('lectura.inferencia', 30), rec('lectura.tesis', 100)], 65).progress;
    p = play(p, 's3', {}, [rec('lectura.inferencia', 40), rec('lectura.tesis', 100)], 70).progress;
    const r = recommend(p);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.items[0].kind).toBe('refuerzo');
      expect(r.items[0].focusSkill).toBe('lectura.inferencia');
      expect(r.items[0].gameId).toBe('entre-lineas');
      expect(r.items.some((i) => i.focusSkill === 'lectura.tesis')).toBe(false); // precisión 100 %: no hace falta reforzar
      expect(r.items.some((i) => i.kind === 'explorar')).toBe(true);
    }
  });
});
