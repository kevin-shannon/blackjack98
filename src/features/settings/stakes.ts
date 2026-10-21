import type { GameOptions } from '../blackjack/model/types';

export const BANKROLL_VALUES = [
  100, 200, 300, 400, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000,
  6000, 7000, 8000, 9000, 10000,
] as const;
export const MIN_BET_VALUES = [5, 10, 25, 50, 75, 100, 250, 500, 1000] as const;
export const MAX_BET_VALUES = [
  100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000,
] as const;
export const STAKES_PRESETS = {
  'small-fry': {
    label: 'Small Fry',
    startingBankroll: 500,
    minBet: 5,
    maxBet: 250,
  },
  'average-joe': {
    label: 'Average Joe',
    startingBankroll: 2500,
    minBet: 25,
    maxBet: 1000,
  },
  'high-roller': {
    label: 'High Roller',
    startingBankroll: 10000,
    minBet: 100,
    maxBet: 5000,
  },
} as const;
export type StakesSettings = Pick<
  GameOptions,
  'stakes' | 'startingBankroll' | 'minBet' | 'maxBet'
>;
export type StakesValueKey = 'startingBankroll' | 'minBet' | 'maxBet';
export function nearestValue(values: readonly number[], value: number) {
  return values.reduce((best, candidate) =>
    Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
  );
}
/** Keep all three controls playable while respecting the slider the user just moved. */
export function normalizeStakes(
  settings: StakesSettings,
  changed?: StakesValueKey,
): StakesSettings {
  if (settings.stakes !== 'custom') {
    const { startingBankroll, minBet, maxBet } =
      STAKES_PRESETS[settings.stakes];
    return { stakes: settings.stakes, startingBankroll, minBet, maxBet };
  }
  let startingBankroll = nearestValue(
    BANKROLL_VALUES,
    settings.startingBankroll,
  );
  let minBet = nearestValue(MIN_BET_VALUES, settings.minBet);
  let maxBet = nearestValue(MAX_BET_VALUES, settings.maxBet);
  if (changed === 'minBet') {
    if (startingBankroll < minBet)
      startingBankroll = BANKROLL_VALUES.find((n) => n >= minBet)!;
    if (maxBet < minBet) maxBet = MAX_BET_VALUES.find((n) => n >= minBet)!;
  } else {
    minBet = Math.min(
      minBet,
      nearestValue(
        MIN_BET_VALUES.filter((n) => n <= Math.min(startingBankroll, maxBet)),
        minBet,
      ),
    );
  }
  return { stakes: 'custom', startingBankroll, minBet, maxBet };
}
