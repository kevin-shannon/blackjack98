import type { CountingTest } from './settings';

export const DECK_STEPS = Array.from(
  { length: 12 },
  (_, index) => (index + 1) / 2,
);
export type CountDrillQuestion =
  | {
      kind: 'deck-estimation';
      decksRemaining: number;
      totalDecks: 6;
      expected: number;
    }
  | {
      kind: 'true-count';
      runningCount: number;
      decksRemaining: number;
      expected: number;
    };

export function createCountQuestion(
  test: Exclude<CountingTest, 'running-count'>,
  random: () => number,
): CountDrillQuestion {
  const decksRemaining = DECK_STEPS[Math.floor(random() * DECK_STEPS.length)];
  if (test === 'deck-estimation')
    return {
      kind: test,
      decksRemaining,
      totalDecks: 6,
      expected: decksRemaining,
    };
  const runningCount = Math.floor(random() * 49) - 24;
  return {
    kind: test,
    runningCount,
    decksRemaining,
    expected: Math.trunc(runningCount / decksRemaining) || 0,
  };
}

export function validCountAnswer(test: CountingTest, answer: number) {
  return test === 'deck-estimation'
    ? Number.isFinite(answer) &&
        answer >= 0.5 &&
        answer <= 6 &&
        Number.isInteger(answer * 2)
    : Number.isSafeInteger(answer);
}
export const signedCount = (count: number) =>
  count > 0 ? `+${count}` : String(count);
