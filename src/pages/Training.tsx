import { Link } from 'react-router-dom';
import { ArrowRight, Info, Play, Target } from 'lucide-react';
import { gameById } from '../data/games';
import { competencyById } from '../data/competencies';
import { Icon } from '../components/Icon';
import { useProgress } from '../store/ProgressContext';
import { recommend, MIN_SKILL_ATTEMPTS } from '../utils/recommend';
import { EmptyState } from '../components/ui';

const KIND = { refuerzo: 'Refuerzo', avanzar: 'Avanzar', explorar: 'Explorar' } as const;

export default function Training() {
  const { progress } = useProgress();
  const rec = recommend(progress);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Entrenamiento personalizado</h1>
      <p className="mt-1 max-w-prose text-muted">Te sugerimos qué jugar a partir de tus partidas reales. El cálculo ocurre en tu navegador, sin inteligencia artificial externa.</p>

      {rec.status === 'insufficient' ? (
        <div className="mt-5">
          <EmptyState title="Aún no hay datos suficientes" text={rec.message}
            action={<Link to="/juegos" className="btn-primary"><Play className="h-4 w-4" aria-hidden="true" />Elegir un juego</Link>} />
          <p className="mt-3 text-center text-sm text-muted">Partidas completadas: {rec.completed} de {rec.needed}.</p>
        </div>
      ) : rec.items.length === 0 ? (
        <div className="mt-5"><EmptyState title="Vas muy bien" text="No hay habilidades por reforzar ni niveles pendientes. Repite los niveles avanzados para subir tus mejores puntajes." action={<Link to="/juegos" className="btn-primary">Ver catálogo</Link>} /></div>
      ) : (
        <ol className="mt-5 space-y-4">
          {rec.items.map((r, i) => {
            const g = gameById(r.gameId)!;
            const c = competencyById(g.competency);
            const qs = new URLSearchParams({ nivel: String(r.difficulty) });
            if (r.focusSkill) qs.set('foco', r.focusSkill);
            return (
              <li key={`${r.gameId}-${r.focusSkill ?? r.kind}`} className={`card-pad ${i === 0 ? 'ring-2 ring-brand/50' : ''}`}>
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: `rgb(var(--${c.token}) / .18)`, color: `rgb(var(--${c.token}))` }}><Icon name={g.icon} className="h-6 w-6" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2"><span className="chip">{i === 0 ? 'Recomendada ahora' : KIND[r.kind]}</span><span className="text-sm text-muted">{g.name} · nivel {r.difficulty}</span></p>
                    <h2 className="mt-1 text-xl font-bold">{r.title}</h2>
                    <p className="reading mt-1 text-sm text-muted">{r.reason}</p>
                  </div>
                  <Link to={`/juego/${r.gameId}?${qs}`} className="btn-primary w-full sm:w-auto"><Target className="h-4 w-4" aria-hidden="true" />Iniciar actividad<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <section className="card-pad mt-8" aria-labelledby="how">
        <h2 id="how" className="flex items-center gap-2 text-lg font-bold"><Info className="h-5 w-5" aria-hidden="true" />Cómo se calcula</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>Se necesitan al menos 3 partidas completadas para generar recomendaciones.</li>
          <li>Refuerzo: habilidades con {MIN_SKILL_ATTEMPTS} o más intentos y precisión ponderada menor de 80 %. La precisión pondera 60 % tus últimos 5 resultados y 40 % el histórico; cada pista por intento suma 0,1 al orden de prioridad.</li>
          <li>Avanzar: juegos con un nivel disponible que todavía no has superado.</li>
          <li>Explorar: competencias que aún no has entrenado.</li>
          <li>Una sesión de refuerzo elige hasta 4 desafíos de esa habilidad y da experiencia, pero no cuenta para superar niveles.</li>
        </ul>
      </section>
    </div>
  );
}
