import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, DEFAULT_RULES } from '../blackjack/model/constants';
import { parseSettings } from './settingsRepository';
describe('settings compatibility and validation', () => {
  it('keeps supported payouts and defaults retired payouts to 3:2', () => {
    for (const payout of ['3:2', '6:5'])
      expect(parseSettings({ rules: { payout } }).rules.payout).toBe(payout);
    for (const payout of ['1:1', '2:1'])
      expect(parseSettings({ rules: { payout } }).rules.payout).toBe('3:2');
  });
  it('defaults Free Play to the common choices without overriding saved rules', () => {
    expect(parseSettings(null).rules).toMatchObject({
      doubleAfterSplit: true,
      hitSoft17: true,
      resplitAces: false,
      surrender: false,
    });
    expect(
      parseSettings({
        rules: {
          doubleAfterSplit: false,
          hitSoft17: false,
          resplitAces: true,
          surrender: true,
        },
      }).rules,
    ).toMatchObject({
      doubleAfterSplit: false,
      hitSoft17: false,
      resplitAces: true,
      surrender: true,
    });
  });
  it('ignores retired HSA preferences while preserving RSA', () => {
    for (const hitSplitAces of [false, true, 'true']) {
      for (const resplitAces of [false, true]) {
        const rules = parseSettings({
          rules: { hitSplitAces, resplitAces },
        }).rules;
        expect(rules).not.toHaveProperty('hitSplitAces');
        expect(rules.resplitAces).toBe(resplitAces);
      }
    }
  });
  it('ignores retired automatic count-quiz preferences', () => {
    const options = parseSettings({
      options: { askCount: true, countInterval: 1 },
    }).options;
    expect(options).not.toHaveProperty('askCount');
    expect(options).not.toHaveProperty('countInterval');
  });
  it('restores preset amounts and preserves the discrete custom values', () => {
    expect(
      parseSettings({ options: { stakes: 'average-joe', startingBankroll: 1 } })
        .options,
    ).toMatchObject({
      stakes: 'average-joe',
      startingBankroll: 2500,
      minBet: 25,
      maxBet: 1000,
    });
    expect(
      parseSettings({
        options: {
          stakes: 'custom',
          startingBankroll: 750,
          minBet: 75,
          maxBet: 1500,
        },
      }).options,
    ).toMatchObject({
      stakes: 'custom',
      startingBankroll: 750,
      minBet: 75,
      maxBet: 1500,
    });
  });
  it('migrates old bankroll preferences to Custom without changing the original limits', () => {
    expect(
      parseSettings({ options: { startingBankroll: 2500 } }).options,
    ).toMatchObject({
      stakes: 'custom',
      startingBankroll: 2500,
      minBet: 5,
      maxBet: 500,
    });
  });
  it('falls back to defaults for malformed data', () => {
    for (const input of [null, [], 'broken', { rules: null, options: [] }]) {
      expect(parseSettings(input)).toEqual({
        rules: DEFAULT_RULES,
        options: DEFAULT_OPTIONS,
        chip: 25,
      });
    }
  });
  it('preserves the original schema and migrates the old $250 chip to $500', () => {
    expect(
      parseSettings({
        rules: { decks: 2, payout: '6:5' },
        options: { timedHands: true },
        chip: 250,
      }),
    ).toMatchObject({
      rules: { decks: 2, payout: '6:5' },
      options: { timedHands: true },
      chip: 500,
    });
  });
  it('bounds numbers, rejects invalid booleans, and validates payout choices', () => {
    const settings = parseSettings({
      rules: {
        decks: 99,
        penetration: -1,
        surrender: 'false',
        payout: '100:1',
      },
      options: { startingBankroll: 1234, seconds: Infinity },
      chip: 1,
    });
    expect(settings).toMatchObject({
      rules: { decks: 8, penetration: 50, surrender: false, payout: '3:2' },
      options: { startingBankroll: 1250, seconds: 10 },
      chip: 25,
    });
  });
});
