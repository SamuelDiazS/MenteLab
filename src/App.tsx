import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Catalog from './pages/Catalog';
import GamePage from './pages/GamePage';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Training from './pages/Training';
import { ProgressProvider } from './store/ProgressContext';

// Estadísticas carga Recharts: se descarga solo cuando se visita la página
const Stats = lazy(() => import('./pages/Stats'));

export const routes = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/juegos', element: <Catalog /> },
      { path: '/juego/:gameId', element: <GamePage /> },
      { path: '/entrenamiento', element: <Training /> },
      { path: '/estadisticas', element: <Suspense fallback={<p role="status" className="py-10 text-center text-muted">Cargando estadísticas…</p>}><Stats /></Suspense> },
      { path: '/perfil', element: <Profile /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>
  );
}
