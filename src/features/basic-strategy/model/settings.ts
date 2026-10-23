import { clamp } from '../../blackjack/model/cards';
import type { StrategySettings } from './types';

export const DEFAULT_STRATEGY_SETTINGS: StrategySettings = {
  rules: { doubleAfterSplit: true, hitSoft17: false, surrender: false },
  options: {
    difficulty: 'normal',
    skipExplanations: false,
    timedHands: false,
    seconds: 10,
  },
};
const KEY = 'blackjack98-basic-strategy-v1';
export interface StrategySettingsRepository {
  load(): StrategySettings;
  save(settings: StrategySettings): void;
}
export function parseStrategySettings(value: unknown): StrategySettings {
  const record = (v: unknown): Record<string, unknown> =>
    v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  const saved = record(value),
    rules = record(saved.rules),
    options = record(saved.options);
  const bool = (v: unknown, fallback: boolean) =>
    typeof v === 'boolean' ? v : fallback;
  return {
    rules: {
      doubleAfterSplit: bool(rules.doubleAfterSplit, true),
      hitSoft17: bool(rules.hitSoft17, false),
      surrender: bool(rules.surrender, false),
    },
    options: {
      skipExplanations: bool(options.skipExplanations, false),
      difficulty: options.difficulty === 'difficult' ? 'difficult' : 'normal',
      timedHands: bool(options.timedHands, false),
      seconds:
        typeof options.seconds === 'number' && Number.isFinite(options.seconds)
          ? clamp(Math.round(options.seconds), 3, 15)
          : 10,
    },
  };
}
export const strategySettingsRepository: StrategySettingsRepository = {
  load() {
    try {
      return parseStrategySettings(
        JSON.parse(localStorage.getItem(KEY) || '{}'),
      );
    } catch {
      return structuredClone(DEFAULT_STRATEGY_SETTINGS);
    }
  },
  save(settings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* Practice remains available when storage is blocked. */
    }
  },
};
