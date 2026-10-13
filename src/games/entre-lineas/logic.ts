import { selectionScore } from '../../utils/scoring';
import type { InferenceChallenge } from './data';

/** Selecciones: crédito parcial por acierto, resta por error. */
export const scoreSelect = (selected: number[], correct: number[]) => selectionScore(selected, correct);

/** Inferencia: 60 puntos por la conclusión, 40 por citar una oración que la sustenta. */
export function scoreInference(c: Pick<InferenceChallenge, 'correctOption' | 'evidence'>, option: string | null, sentence: number | null): number {
  return (option === c.correctOption ? 60 : 0) + (sentence !== null && c.evidence.includes(sentence) ? 40 : 0);
}
