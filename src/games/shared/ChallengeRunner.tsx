import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PASS_THRESHOLD } from '../../config';
import { skillById } from '../../data/competencies';
import type { ChallengeRecord, Difficulty, GameRuntimeProps, SkillId } from '../../types';
import { useStopwatch } from '../../hooks/useStopwatch';
import { Feedback } from './Feedback';

export interface BaseChallenge {
  id: string;
  skill: SkillId;
  title: string;
  difficulty: Difficulty;
  explanation: string;
}

export interface Resolution {
  score: number;
  attempts?: number;
  hintsUsed?: number;
  answer?: string;
}

export interface RenderCtx {
  locked: boolean;
  resolve: (r: Resolution) => void;
}

interface Props<T extends BaseChallenge> extends Pick<GameRuntimeProps, 'report' | 'setProgress' | 'finish' | 'paused'> {
  challenges: T[];
  render: (c: T, ctx: RenderCtx) => ReactNode;
}

/** Recorre una lista de desafíos: renderiza, registra el resultado y muestra la explicación. */
export function ChallengeRunner<T extends BaseChallenge>({ challenges, render, report, setProgress, finish, paused }: Props<T>) {
  const [index, setIndex] = useState(0);
  const [res, setRes] = useState<Resolution | null>(null);
  const watch = useStopwatch(paused || res !== null);
  const reported = useRef(false);
  const challenge = challenges[index];

  useEffect(() => { setProgress(index + (res ? 1 : 0), challenges.length); }, [index, res, challenges.length, setProgress]);

  const resolve = (r: Resolution) => {
    if (reported.current) return;
    reported.current = true;
    const score = Math.max(0, Math.min(100, Math.round(r.score)));
    const record: ChallengeRecord = {
      challengeId: challenge.id,
      skill: challenge.skill,
      title: challenge.title,
      score,
      correct: score >= PASS_THRESHOLD,
      attempts: r.attempts ?? 1,
      hintsUsed: r.hintsUsed ?? 0,
      timeSec: watch.read(),
      explanation: challenge.explanation,
      answer: r.answer,
    };
    report(record);
    setRes({ ...r, score });
  };

  const next = () => {
    if (index + 1 >= challenges.length) { finish(); return; }
    reported.current = false;
    watch.reset();
    setRes(null);
    setIndex(index + 1);
  };

  if (!challenge) return null;
  const skill = skillById(challenge.skill);
  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <span className="chip">Desafío {index + 1} de {challenges.length}</span>
        {skill && <span className="chip">{skill.label}</span>}
        <span className="chip">Dificultad {challenge.difficulty}</span>
      </header>
      <h2 className="font-display text-2xl font-bold">{challenge.title}</h2>
      <div key={challenge.id} className="mt-3">{render(challenge, { locked: res !== null, resolve })}</div>
      {res && <Feedback score={res.score} explanation={challenge.explanation} onNext={next} last={index + 1 >= challenges.length} />}
    </div>
  );
}
