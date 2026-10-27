import {
  createPracticeStats,
  recordStrategyAnswer,
} from '../../stats/sessionStats';
import type {
  PracticeStats,
  RunningCountStats,
} from '../../stats/sessionStats';
import type { CountingTest } from './settings';

/** Each count point of error costs ten percentage points, regardless of sign. */
export const trueCountAnswerScore = (answer: number, expected: number) =>
  Math.max(0, 100 - Math.abs(answer - expected) * 10);

export const createCountStats = (): RunningCountStats => ({
  ...createPracticeStats('running-count'),
  accuracyPoints: 0,
});

// Fast Refresh can preserve a session created before partial-credit scores existed.
type CompatibleCountStats = PracticeStats<'running-count'> & {
  accuracyPoints?: number;
};
function accumulatedPoints(stats: CompatibleCountStats) {
  return typeof stats.accuracyPoints === 'number' &&
    Number.isFinite(stats.accuracyPoints)
    ? stats.accuracyPoints
    : stats.correct * 100;
}

export function recordCountAnswer(
  stats: CompatibleCountStats,
  test: CountingTest,
  answer: number,
  expected: number,
): RunningCountStats {
  const correct = answer === expected;
  return {
    ...recordStrategyAnswer(stats, correct),
    accuracyPoints:
      accumulatedPoints(stats) +
      (test === 'true-count'
        ? trueCountAnswerScore(answer, expected)
        : correct
          ? 100
          : 0),
  };
}

export const countAccuracy = (stats: CompatibleCountStats) =>
  stats.attempts ? accumulatedPoints(stats) / stats.attempts : 0;
