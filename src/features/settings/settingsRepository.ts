import {
  CHIPS,
  DEFAULT_OPTIONS,
  DEFAULT_RULES,
} from '../blackjack/model/constants';
import { clamp } from '../blackjack/model/cards';
import type { Payout, Settings } from '../blackjack/model/types';
import { normalizeStakes, STAKES_PRESETS } from './stakes';
export interface SettingsRepository {
  load(): Settings;
  save(settings: Settings): void;
}
const KEY = 'blackjack98-v3';
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const number = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  step = 1,
) => {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : NaN;
  return Number.isFinite(n)
    ? clamp(Math.round(n / step) * step, min, max)
    : fallback;
};
const boolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;
/** Keeps the original storage key/schema; treats browser data as untrusted input. */
export function parseSettings(value: unknown): Settings {
  const saved = record(value),
    r = record(saved.rules),
    o = record(saved.options);
  const chip = Number(saved.chip) === 250 ? 500 : Number(saved.chip);
  return {
    rules: {
      decks: number(r.decks, DEFAULT_RULES.decks, 1, 8),
      penetration: number(r.penetration, DEFAULT_RULES.penetration, 50, 95),
      doubleAfterSplit: boolean(
        r.doubleAfterSplit,
        DEFAULT_RULES.doubleAfterSplit,
      ),
      hitSoft17: boolean(r.hitSoft17, DEFAULT_RULES.hitSoft17),
      resplitAces: boolean(r.resplitAces, DEFAULT_RULES.resplitAces),
      surrender: boolean(r.surrender, DEFAULT_RULES.surrender),
      payout: ['3:2', '6:5'].includes(String(r.payout))
        ? (r.payout as Payout)
        : DEFAULT_RULES.payout,
    },
    options: {
      ...normalizeStakes({
        stakes:
          typeof o.stakes === 'string' &&
          Object.hasOwn(STAKES_PRESETS, o.stakes)
            ? (o.stakes as keyof typeof STAKES_PRESETS)
            : 'custom',
        startingBankroll: number(
          o.startingBankroll,
          DEFAULT_OPTIONS.startingBankroll,
          100,
          10000,
        ),
        minBet: number(o.minBet, DEFAULT_OPTIONS.minBet, 5, 1000),
        maxBet: number(o.maxBet, DEFAULT_OPTIONS.maxBet, 100, 10000),
      }),
      timedHands: boolean(o.timedHands, DEFAULT_OPTIONS.timedHands),
      seconds: number(o.seconds, DEFAULT_OPTIONS.seconds, 3, 15),
    },
    chip: CHIPS.some((n) => n === chip) ? chip : 25,
  };
}
export const browserSettingsRepository: SettingsRepository = {
  load() {
    try {
      return parseSettings(JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch {
      return parseSettings({});
    }
  },
  save(settings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* Private browsing and full storage must not interrupt a session. */
    }
  },
};
