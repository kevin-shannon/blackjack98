import { clamp } from '../../blackjack/model/cards';
import type { PracticeSettingsRepository } from '../../training/model/types';
import type { DeviationSettings } from './types';

export const DEFAULT_DEVIATION_SETTINGS: DeviationSettings = {
  rules: { hitSoft17: false },
  options: {
    set: 'both',
    skipExplanations: false,
    timedHands: false,
    seconds: 10,
  },
};
export function parseDeviationSettings(value: unknown): DeviationSettings {
  const record = (v: unknown): Record<string, unknown> =>
    v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  const saved = record(value),
    rules = record(saved.rules),
    options = record(saved.options);
  return {
    rules: {
      hitSoft17: typeof rules.hitSoft17 === 'boolean' ? rules.hitSoft17 : false,
    },
    options: {
      skipExplanations:
        typeof options.skipExplanations === 'boolean'
          ? options.skipExplanations
          : false,
      set:
        options.set === 'illustrious-18' || options.set === 'fab-4'
          ? options.set
          : 'both',
      timedHands:
        typeof options.timedHands === 'boolean' ? options.timedHands : false,
      seconds:
        typeof options.seconds === 'number' && Number.isFinite(options.seconds)
          ? clamp(Math.round(options.seconds), 3, 15)
          : 10,
    },
  };
}
export type DeviationSettingsRepository =
  PracticeSettingsRepository<DeviationSettings>;
export const deviationSettingsRepository: DeviationSettingsRepository = {
  load() {
    try {
      return parseDeviationSettings(
        JSON.parse(localStorage.getItem('blackjack98-deviations-v1') || '{}'),
      );
    } catch {
      return structuredClone(DEFAULT_DEVIATION_SETTINGS);
    }
  },
  save(settings) {
    try {
      localStorage.setItem(
        'blackjack98-deviations-v1',
        JSON.stringify(settings),
      );
    } catch {
      /* Practice remains available when storage is blocked. */
    }
  },
};
