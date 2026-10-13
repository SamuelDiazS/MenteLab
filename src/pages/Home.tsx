import { Link } from 'react-router-dom';
import { Clock, Flame, Gamepad2, Sparkles, Target, Zap } from 'lucide-react';
import { APP_NAME } from '../config';
import { competencyById } from '../data/competencies';
import { GAMES } from '../data/games';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ui';
import { useProgress } from '../store/ProgressContext';
import { currentStreak, formatDuration } from '../utils/dates';
import { levelFromXp } from '../utils/levels';
import { totalCompleted } from '../utils/stats';

const HEX = 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)';

export default function Home() {
  const { progress } = useProgress();
  const lv = levelFromXp(progress.xp);
  const streak = currentStreak(progress.trainingDays);
  const fresh = totalCompleted(progress) === 0;
  const stats = [
    { icon: Sparkles, k: 'Nivel', v: String(lv.level) },
    { icon: Zap, k: 'Experiencia', v: `${progress.xp} XP` },
    { icon: Flame, k: 'Racha', v: `${streak} ${streak === 1 ? 'día' : 'días'}` },
    { icon: Gamepad2, k: 'Partidas completadas', v: String(totalCompleted(progress)) },
    { icon: Clock, k: 'Tiempo de juego', v: formatDuration(progress.totalSeconds) },
  ];
  const rows = [GAMES.slice(0, 3), GAMES.slice(3)];
  return (
    <div>
      <section className="grid items-center gap-8 py-4 lg:grid-cols-[1.1fr_1fr]" aria-labelledby="hero-title">
        <div>
          <h1 id="hero-title" className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">Entrena cómo piensas, no solo qué recuerdas.</h1>
          <p className="mt-4 max-w-prose text-lg text-muted">{APP_NAME} convierte las competencias de Saber 11 en seis minijuegos: investigas textos, configuras máquinas lógicas, ajustas modelos, gobiernas una ciudad y sobrevives en inglés.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/juegos" className="btn-primary !px-6"><Gamepad2 className="h-4 w-4" aria-hidden="true" />Explorar juegos</Link>
            <Link to="/entrenamiento" className="btn-ghost"><Target className="h-4 w-4" aria-hidden="true" />Entrenamiento personalizado</Link>
          </div>
          <p className="mt-3 text-xs text-muted">{fresh ? 'Todavía no has jugado: elige un hexágono y empieza por el nivel 1.' : 'Tu progreso se guarda en este navegador.'}</p>
        </div>

        <nav aria-label="Juegos" className="mx-auto flex flex-col items-center">
          {rows.map((row, ri) => (
            <div key={ri} className="flex" style={{ marginTop: ri ? '-1.6rem' : 0, marginLeft: ri ? '0' : '0', transform: ri ? 'translateX(0)' : undefined }}>
              {row.map((g, gi) => {
                const c = competencyById(g.competency);
                const cleared = (progress.cleared[g.id] ?? []).length;
                return (
                  <Link key={g.id} to={`/juego/${g.id}`} aria-label={`${g.name}: ${c.name}. Niveles superados ${cleared} de 3`}
                    className="group relative -mx-0.5 block h-[128px] w-[116px] transition-transform hover:-translate-y-1 sm:h-[158px] sm:w-[144px]" style={{ marginLeft: ri && gi === 0 ? '4.4rem' : undefined }}>
                    <span className="absolute inset-0" style={{ clipPath: HEX, background: `rgb(var(--${c.token}))` }} />
                    <span className="absolute inset-[3px] flex flex-col items-center justify-center gap-1 bg-panel text-center" style={{ clipPath: HEX, background: `linear-gradient(160deg, rgb(var(--${c.token}) / .28), rgb(var(--panel)))` }}>
                      <span style={{ color: `rgb(var(--${c.token}))` }}><Icon name={g.icon} className="h-7 w-7 sm:h-8 sm:w-8" /></span>
                      <span className="px-3 text-[11px] font-bold leading-tight sm:text-xs">{g.name}</span>
                      <span className="flex gap-1" aria-hidden="true">{[1, 2, 3].map((n) => <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= cleared ? 'bg-ink' : 'bg-line'}`} />)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </section>

      <section className="card-pad mt-8" aria-labelledby="panel-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="panel-title" className="text-xl font-bold">Tu panel</h2>
          <p className="text-sm text-muted">{lv.current} / {lv.needed} XP para el nivel {lv.level + 1}</p>
        </div>
        <div className="mt-2"><ProgressBar value={lv.pct} label="Experiencia hacia el siguiente nivel" /></div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.k} className="rounded-xl bg-raised/50 p-3"><dt className="flex items-center gap-1.5 text-xs text-muted"><s.icon className="h-3.5 w-3.5" aria-hidden="true" />{s.k}</dt><dd className="mt-0.5 font-display text-xl font-bold">{s.v}</dd></div>
          ))}
        </dl>
      </section>

      <section className="mt-8" aria-labelledby="comp-title">
        <h2 id="comp-title" className="text-xl font-bold">Competencias que entrenas</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => {
            const c = competencyById(g.competency);
            return (
              <li key={g.id}>
                <Link to={`/juego/${g.id}`} className="card flex h-full gap-3 p-4 transition-colors hover:bg-raised">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: `rgb(var(--${c.token}) / .18)`, color: `rgb(var(--${c.token}))` }}><Icon name={g.icon} /></span>
                  <span><span className="block font-bold">{c.name}</span><span className="block text-sm text-muted">{g.name}: {g.tagline}</span></span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
