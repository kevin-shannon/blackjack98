import type { HandResult } from '../blackjack/model/types';

export interface FreePlayStats {
  modeId: 'free-play';
  completedRounds: number;
  sessionNet: number;
  wins: number;
  losses: number;
  pushes: number;
}
export interface BasicStrategyStats {
  modeId: 'basic-strategy';
  attempts: number;
  correct: number;
  incorrect: number;
  timeouts: number;
  streak: number;
  bestStreak: number;
}
export interface StatsByMode {
  'free-play': FreePlayStats;
  'basic-strategy': BasicStrategyStats;
}
export const createFreePlayStats = (): FreePlayStats => ({
  modeId: 'free-play',
  completedRounds: 0,
  sessionNet: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
});
export const createBasicStrategyStats = (): BasicStrategyStats => ({
  modeId: 'basic-strategy',
  attempts: 0,
  correct: 0,
  incorrect: 0,
  timeouts: 0,
  streak: 0,
  bestStreak: 0,
});
export function recordFreePlayRound(
  stats: FreePlayStats,
  results: HandResult[],
  net: number,
): FreePlayStats {
  return {
    ...stats,
    completedRounds: stats.completedRounds + 1,
    sessionNet: stats.sessionNet + net,
    wins:
      stats.wins +
      results.filter((result) => result === 'WIN' || result === 'BLACKJACK')
        .length,
    pushes: stats.pushes + results.filter((result) => result === 'PUSH').length,
    losses:
      stats.losses +
      results.filter((result) => !['WIN', 'BLACKJACK', 'PUSH'].includes(result))
        .length,
  };
}
export function recordStrategyAnswer(
  stats: BasicStrategyStats,
  correct: boolean,
  timedOut = false,
): BasicStrategyStats {
  const streak = correct ? stats.streak + 1 : 0;
  return {
    ...stats,
    attempts: stats.attempts + 1,
    correct: stats.correct + Number(correct),
    incorrect: stats.incorrect + Number(!correct),
    timeouts: stats.timeouts + Number(timedOut),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
}
export const accuracy = (stats: BasicStrategyStats) =>
  stats.attempts ? (stats.correct / stats.attempts) * 100 : 0;
