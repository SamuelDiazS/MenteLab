import type { GameId, GameModule } from '../types';
import { ciudadEnEquilibrio } from './ciudad-en-equilibrio';
import { contextQuest } from './context-quest';
import { ecosistema404 } from './ecosistema-404';
import { entreLineas } from './entre-lineas';
import { laboratorioNumerico } from './laboratorio-numerico';
import { protocoloLogico } from './protocolo-logico';

export const REGISTRY: Record<GameId, GameModule> = {
  'entre-lineas': entreLineas,
  'protocolo-logico': protocoloLogico,
  'laboratorio-numerico': laboratorioNumerico,
  'ecosistema-404': ecosistema404,
  'ciudad-en-equilibrio': ciudadEnEquilibrio,
  'context-quest': contextQuest,
};

export const getGameModule = (id: string): GameModule | undefined => REGISTRY[id as GameId];
