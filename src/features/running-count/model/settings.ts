import { clamp } from '../../blackjack/model/cards';

export type CountingTest = 'running-count' | 'deck-estimation' | 'true-count';
export const COUNTING_TEST_LABELS: Record<CountingTest, string> = {
  'running-count': 'Running Count',
  'deck-estimation': 'Deck Estimation',
  'true-count': 'True Count',
};
export interface RunningCountOptions {
  test: CountingTest;
  pace: number;
  askEvery: number;
}
export const PACE_DELAYS = [
  2000, 1500, 1200, 1000, 800, 650, 500, 350, 250, 150,
] as const;
export const DEFAULT_COUNT_OPTIONS: RunningCountOptions = {
  test: 'running-count',
  pace: 5,
  askEvery: 3,
};
export const paceDelay = (options: RunningCountOptions) =>
  PACE_DELAYS[options.pace - 1];
export function parseCountOptions(value: unknown): RunningCountOptions {
  const saved =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  const number = (key: 'pace' | 'askEvery') => {
    const value = saved[key];
    return typeof value === 'number' && Number.isFinite(value)
      ? clamp(Math.round(value), 1, 10)
      : DEFAULT_COUNT_OPTIONS[key];
  };
  return {
    test:
      saved.test === 'deck-estimation' || saved.test === 'true-count'
        ? saved.test
        : 'running-count',
    pace: number('pace'),
    askEvery: number('askEvery'),
  };
}
export interface CountSettingsRepository {
  load(): RunningCountOptions;
  save(options: RunningCountOptions): void;
}
const KEY = 'blackjack98-running-count-v1';
export const countSettingsRepository: CountSettingsRepository = {
  load() {
    try {
      return parseCountOptions(JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch {
      return { ...DEFAULT_COUNT_OPTIONS };
    }
  },
  save(options) {
    try {
      localStorage.setItem(KEY, JSON.stringify(options));
    } catch {
      /* Practice stays available when storage is unavailable. */
    }
  },
};
