import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return <EmptyState page title="Página no encontrada" text="La dirección no existe. Vuelve al inicio o explora los juegos." action={<div className="flex gap-2"><Link to="/" className="btn-primary">Ir al inicio</Link><Link to="/juegos" className="btn-ghost">Ver juegos</Link></div>} />;
}
