import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COMPETENCIES } from '../data/competencies';
import { GAMES } from '../data/games';
import { ACHIEVEMENTS } from '../data/achievements';
import { Icon } from '../components/Icon';
import { EmptyState, ProgressBar } from '../components/ui';
import { useProgress } from '../store/ProgressContext';
import { formatDate, formatDuration } from '../utils/dates';
import { levelFromXp } from '../utils/levels';
import { competencyAccuracy, diagnosis, gameName, MIN_DIAGNOSIS_ATTEMPTS, overallAccuracy, skillBreakdown, totalAbandoned, totalCompleted, totalStarted } from '../utils/stats';
import type { GameId } from '../types';

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)} %`);
const LEVEL_TXT = { fortaleza: 'Fortaleza', intermedio: 'En desarrollo', 'por-mejorar': 'Por mejorar' } as const;

export default function Stats() {
  const { progress } = useProgress();
  const [gameId, setGameId] = useState<GameId>(GAMES[0].id);
  const lv = levelFromXp(progress.xp);
  const completed = totalCompleted(progress);
  const hasData = totalStarted(progress) > 0;

  const compData = COMPETENCIES.map((c) => ({ name: c.short, precision: Math.round((competencyAccuracy(progress, c.id) ?? 0) * 100), intentos: Object.entries(progress.skillStats).filter(([k]) => k.startsWith(`${c.id}.`)).reduce((a, [, v]) => a + v.attempts, 0) }));
  const evolution = useMemo(() => progress.sessions.filter((s) => s.gameId === gameId && s.status === 'completed').slice(-15).map((s, i) => ({ n: i + 1, puntaje: s.score, nivel: s.difficulty })), [progress.sessions, gameId]);
  const diag = diagnosis(progress);
  const history = [...progress.sessions].reverse().slice(0, 25);
  const bests = GAMES.flatMap((g) => ([1, 2, 3] as const).map((d) => ({ g, d, v: progress.best[`${g.id}:${d}`] }))).filter((b) => b.v !== undefined);

  return (
    <div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Estadísticas</h1>
      <p className="mt-1 max-w-prose text-muted">Todo se calcula con tus partidas guardadas en este navegador. Los puntajes de MenteLab son internos: no equivalen a un puntaje oficial de Saber 11 ni predicen tu resultado en el examen.</p>

      {!hasData ? (
        <div className="mt-5"><EmptyState title="Todavía no hay partidas" text="Cuando juegues, aquí verás tu precisión, tu evolución y tu historial." action={<Link to="/juegos" className="btn-primary">Jugar ahora</Link>} /></div>
      ) : (
        <>
          <section className="mt-6" aria-labelledby="g-title">
            <h2 id="g-title" className="mb-3 text-xl font-bold">Resumen global</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['Experiencia total', `${progress.xp} XP`], ['Nivel actual', String(lv.level)], ['Partidas iniciadas', String(totalStarted(progress))], ['Completadas', String(completed)], ['Abandonadas', String(totalAbandoned(progress))], ['Precisión general', pct(overallAccuracy(progress))], ['Tiempo de entrenamiento', formatDuration(progress.totalSeconds)], ['Logros', `${Object.keys(progress.achievements).length} de ${ACHIEVEMENTS.length}`]].map(([k, v]) => (
                <div key={k} className="card p-4"><dt className="text-xs text-muted">{k}</dt><dd className="font-display text-2xl font-bold">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted">La precisión es el promedio de puntos obtenidos en cada desafío (con crédito parcial). Es comparable entre competencias porque siempre va de 0 a 100 %.</p>
          </section>

          <section className="card-pad mt-6" aria-labelledby="c-title">
            <h2 id="c-title" className="text-xl font-bold">Precisión por competencia</h2>
            <div className="mt-3 h-64" role="img" aria-label={`Precisión por competencia: ${compData.map((c) => `${c.name} ${c.precision} %`).join(', ')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compData} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} unit=" %" />
                  <Tooltip contentStyle={{ background: 'rgb(var(--panel))', border: '1px solid rgb(var(--line))', borderRadius: 12, color: 'rgb(var(--ink))' }} formatter={(v: number) => [`${v} %`, 'Precisión']} />
                  <Bar dataKey="precision" fill="rgb(var(--brand))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted sm:grid-cols-3">{compData.map((c) => <li key={c.name}>{c.name}: {c.intentos ? `${c.precision} % (${c.intentos} desafíos)` : 'sin datos'}</li>)}</ul>
          </section>

          <section className="card-pad mt-6" aria-labelledby="d-title">
            <h2 id="d-title" className="text-xl font-bold">Diagnóstico</h2>
            {diag.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Se necesitan al menos {MIN_DIAGNOSIS_ATTEMPTS} desafíos resueltos en una competencia para describir sus fortalezas y aspectos por mejorar. Sigue jugando.</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {diag.map((d) => {
                  const c = COMPETENCIES.find((x) => x.id === d.competency)!;
                  return <li key={d.competency} className="rounded-xl bg-raised/40 p-3"><p className="flex items-center justify-between font-bold">{c.name}<span className="chip">{LEVEL_TXT[d.level]}</span></p><p className="text-sm text-muted">{Math.round(d.accuracy * 100)} % de precisión en {d.attempts} desafíos.</p></li>;
                })}
              </ul>
            )}
          </section>

          <section className="card-pad mt-6" aria-labelledby="e-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="e-title" className="text-xl font-bold">Estadísticas por juego</h2>
              <label className="flex items-center gap-2 text-sm text-muted">Juego
                <select className="field text-ink" value={gameId} onChange={(e) => setGameId(e.target.value as GameId)}>{GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
              </label>
            </div>
            {(() => {
              const gs = progress.gameStats[gameId];
              return (
                <p className="mt-2 text-sm text-muted">
                  {gs ? `${gs.started} iniciadas · ${gs.completed} completadas · ${gs.abandoned} abandonadas · puntaje medio ${gs.completed ? Math.round(gs.scoreSum / gs.completed) : '—'} · ${formatDuration(gs.seconds)}` : 'Aún no has jugado este juego.'}
                </p>
              );
            })()}
            {evolution.length >= 2 ? (
              <div className="mt-3 h-56" role="img" aria-label={`Evolución del puntaje en ${gameName(gameId)}: ${evolution.map((e) => e.puntaje).join(', ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolution} margin={{ left: -16, right: 8 }}>
                    <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                    <XAxis dataKey="n" tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} label={{ value: 'Partida', position: 'insideBottom', offset: -2, fill: 'rgb(var(--muted))', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'rgb(var(--panel))', border: '1px solid rgb(var(--line))', borderRadius: 12 }} formatter={(v: number) => [v, 'Puntaje']} />
                    <Line type="monotone" dataKey="puntaje" stroke="rgb(var(--brand))" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="mt-3 text-sm text-muted">La gráfica de evolución aparece con al menos dos partidas completadas de este juego.</p>}
            <h3 className="mt-4 font-bold">Habilidades de este juego</h3>
            <ul className="mt-2 space-y-2">
              {skillBreakdown(progress, gameId).map(({ skill, attempts, accuracy }) => (
                <li key={skill.id}><div className="mb-1 flex justify-between text-sm"><span>{skill.label}</span><span className="text-muted">{accuracy === null ? 'sin datos' : `${Math.round(accuracy * 100)} % · ${attempts} intentos`}</span></div><ProgressBar value={accuracy ?? 0} label={`Precisión en ${skill.label}`} /></li>
              ))}
            </ul>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card-pad" aria-labelledby="b-title">
              <h2 id="b-title" className="text-xl font-bold">Mejores resultados</h2>
              {bests.length === 0 ? <p className="mt-2 text-sm text-muted">Supera un nivel completo para registrar tu primer récord.</p> : (
                <ul className="mt-3 space-y-1.5 text-sm">{bests.map((b) => <li key={`${b.g.id}${b.d}`} className="flex justify-between"><span>{b.g.name} · nivel {b.d}</span><strong>{b.v}</strong></li>)}</ul>
              )}
            </div>
            <div className="card-pad" aria-labelledby="a-title">
              <h2 id="a-title" className="text-xl font-bold">Logros</h2>
              <ul className="mt-3 grid gap-2">
                {ACHIEVEMENTS.map((a) => {
                  const on = !!progress.achievements[a.id];
                  return <li key={a.id} className={`flex items-center gap-3 rounded-xl p-2.5 ${on ? 'bg-warn/10' : 'bg-raised/30 opacity-70'}`}><Icon name={a.icon} className={`h-5 w-5 ${on ? 'text-warn' : 'text-muted'}`} /><div className="text-sm"><p className="font-bold">{a.name} <span className="font-normal text-muted">{on ? '· desbloqueado' : '· bloqueado'}</span></p><p className="text-xs text-muted">{a.description}</p></div></li>;
                })}
              </ul>
            </div>
          </section>

          <section className="card-pad mt-6" aria-labelledby="h-title">
            <h2 id="h-title" className="text-xl font-bold">Historial de partidas</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs text-muted"><tr><th className="py-2 pr-3">Fecha</th><th className="pr-3">Juego</th><th className="pr-3">Nivel</th><th className="pr-3">Estado</th><th className="pr-3">Puntaje</th><th>Duración</th></tr></thead>
                <tbody>{history.map((s) => (
                  <tr key={s.id} className="border-t border-line"><td className="py-2 pr-3">{formatDate(s.startedAt)}</td><td className="pr-3">{gameName(s.gameId)}{s.mode === 'refuerzo' ? ' (refuerzo)' : ''}</td><td className="pr-3">{s.difficulty}</td><td className="pr-3">{s.status === 'completed' ? 'Completada' : s.status === 'abandoned' ? 'Abandonada' : 'En curso'}</td><td className="pr-3">{s.status === 'completed' ? s.score : '—'}</td><td>{formatDuration(s.durationSec)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
