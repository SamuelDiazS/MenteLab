/** XP acumulada necesaria para alcanzar el nivel L: 100·(L-1)·L/2  (2→100, 3→300, 4→600…) */
export const xpForLevel = (level: number) => (100 * (level - 1) * level) / 2;

export function levelFromXp(xp: number): { level: number; current: number; needed: number; pct: number } {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const needed = xpForLevel(level + 1) - base;
  const current = xp - base;
  return { level, current, needed, pct: needed ? current / needed : 0 };
}
