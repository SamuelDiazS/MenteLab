import { BookOpen, Compass, Cpu, FlaskConical, Flame, Gamepad2, Landmark, Layers, Leaf, Mountain, Search, Sparkles, Star, TrendingUp, Trophy, type LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  search: Search,
  cpu: Cpu,
  'flask-conical': FlaskConical,
  leaf: Leaf,
  landmark: Landmark,
  compass: Compass,
  trophy: Trophy,
  gamepad: Gamepad2,
  sparkles: Sparkles,
  layers: Layers,
  mountain: Mountain,
  'trending-up': TrendingUp,
  flame: Flame,
  star: Star,
  book: BookOpen,
};

export function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const C = MAP[name] ?? Star;
  return <C className={className} aria-hidden="true" />;
}
