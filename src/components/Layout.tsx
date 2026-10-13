import { NavLink, Outlet, ScrollRestoration, Link } from 'react-router-dom';
import { BarChart3, Gamepad2, Home, Target, User, X } from 'lucide-react';
import { APP_NAME } from '../config';
import { useProgress } from '../store/ProgressContext';
import { Logo } from './Logo';

const LINKS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/juegos', label: 'Explorar juegos', short: 'Juegos', icon: Gamepad2 },
  { to: '/entrenamiento', label: 'Entrenamiento personalizado', short: 'Entrenar', icon: Target },
  { to: '/estadisticas', label: 'Estadísticas', short: 'Datos', icon: BarChart3 },
  { to: '/perfil', label: 'Perfil y progreso local', short: 'Perfil', icon: User },
];

export default function Layout() {
  const { loadStatus, saveFailed, dismissLoadNotice } = useProgress();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-bg">Saltar al contenido</a>
      <header className="hidden border-b border-line bg-bg/80 backdrop-blur md:block">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3">
          <Link to="/" className="mr-4 flex items-center gap-2 font-display text-xl font-extrabold"><Logo />{APP_NAME}</Link>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-brand/20 text-ink' : 'text-muted hover:bg-raised hover:text-ink'}`}>{l.label}</NavLink>
          ))}
        </nav>
      </header>
      <header className="flex items-center gap-2 border-b border-line px-4 py-3 md:hidden">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold"><Logo />{APP_NAME}</Link>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12">
        {loadStatus === 'corrupt' && (
          <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-warn/50 bg-warn/10 p-3 text-sm">
            <p className="flex-1">Los datos guardados en este navegador estaban dañados o eran de una versión incompatible, así que se empezó con un progreso nuevo. Si tienes una copia exportada, puedes importarla desde Perfil.</p>
            <button type="button" className="btn-ghost !min-h-[32px] !px-2" onClick={dismissLoadNotice} aria-label="Cerrar aviso"><X className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        )}
        {(loadStatus === 'unavailable' || saveFailed) && (
          <div role="alert" className="mb-4 rounded-xl border border-bad/50 bg-bad/10 p-3 text-sm">No se puede guardar en este navegador (almacenamiento bloqueado o lleno). Puedes jugar, pero el progreso se perderá al cerrar la pestaña. Exporta una copia desde Perfil.</div>
        )}
        <Outlet />
      </main>

      <footer className="hidden border-t border-line py-6 text-center text-xs text-muted md:block">
        {APP_NAME} es un proyecto educativo independiente, sin afiliación al ICFES. Tu progreso se guarda solo en este navegador.
      </footer>

      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} aria-label={l.label} className={({ isActive }) => `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-brand' : 'text-muted'}`}>
                {({ isActive }) => (<><l.icon className="h-5 w-5" aria-hidden="true" /><span className={isActive ? 'underline underline-offset-4' : ''}>{l.short ?? l.label}</span></>)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <ScrollRestoration />
    </div>
  );
}

