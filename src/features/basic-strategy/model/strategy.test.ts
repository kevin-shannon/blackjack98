import { describe, expect, it } from 'vitest';
import type { Card, PlayerAction, Rank } from '../../blackjack/model/types';
import { RANKS } from '../../blackjack/model/constants';
import { value } from '../../blackjack/model/cards';
import { recommendAction } from './strategy';
import { drawInfiniteCard, dealQuestion } from './questions';
import { DEFAULT_STRATEGY_SETTINGS, parseStrategySettings } from './settings';

const card = (rank: Rank, id = 1): Card => ({ rank, suit: 'S', id });
const rules = DEFAULT_STRATEGY_SETTINGS.rules;
const dealers: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
const codes: Record<string, PlayerAction> = {
  H: 'hit',
  S: 'stand',
  D: 'double',
  P: 'split',
};

describe('standard S17 decisions by dealer upcard 2 through Ace', () => {
  it.each([
    ['2', '4', 'HHHHHHHHHH'],
    ['4', '5', 'HDDDDHHHHH'],
    ['4', '6', 'DDDDDDDDHH'],
    ['5', '6', 'DDDDDDDDDH'],
    ['10', '2', 'HHSSSHHHHH'],
    ['10', '3', 'SSSSSHHHHH'],
    ['10', '4', 'SSSSSHHHHH'],
    ['10', '5', 'SSSSSHHHHH'],
    ['10', '6', 'SSSSSHHHHH'],
    ['10', '7', 'SSSSSSSSSS'],
    ['A', '2', 'HHHDDHHHHH'],
    ['A', '3', 'HHHDDHHHHH'],
    ['A', '4', 'HHDDDHHHHH'],
    ['A', '5', 'HHDDDHHHHH'],
    ['A', '6', 'HDDDDHHHHH'],
    ['A', '7', 'SDDDDSSHHH'],
    ['A', '8', 'SSSSSSSSSS'],
    ['A', '9', 'SSSSSSSSSS'],
    ['2', '2', 'PPPPPPHHHH'],
    ['3', '3', 'PPPPPPHHHH'],
    ['4', '4', 'HHHPPHHHHH'],
    ['5', '5', 'DDDDDDDDHH'],
    ['6', '6', 'PPPPPHHHHH'],
    ['7', '7', 'PPPPPPHHHH'],
    ['8', '8', 'PPPPPPPPPP'],
    ['9', '9', 'PPPPPSPPSS'],
    ['K', 'J', 'SSSSSSSSSS'],
    ['A', 'A', 'PPPPPPPPPP'],
  ] as [Rank, Rank, string][])(
    'grades %s,%s across the full dealer row',
    (a, b, expected) => {
      expect(
        dealers.map((dealer) =>
          recommendAction([card(a), card(b)], card(dealer), rules),
        ),
      ).toEqual([...expected].map((code) => codes[code]));
    },
  );
});
describe('table rule variations', () => {
  it.each([
    ['2', '2', '2', 'hit'],
    ['3', '3', '3', 'hit'],
    ['4', '4', '5', 'hit'],
    ['6', '6', '2', 'hit'],
    ['6', '6', '3', 'split'],
    ['2', '2', '4', 'split'],
  ] as [Rank, Rank, Rank, PlayerAction][])(
    'without DAS: %s,%s vs %s is %s',
    (a, b, up, expected) => {
      expect(
        recommendAction([card(a), card(b)], card(up), {
          ...rules,
          doubleAfterSplit: false,
        }),
      ).toBe(expected);
    },
  );
  it.each([
    ['5', '6', 'A', 'double'],
    ['A', '7', '2', 'double'],
    ['A', '8', '6', 'double'],
  ] as [Rank, Rank, Rank, PlayerAction][])(
    'H17: %s,%s vs %s is %s',
    (a, b, up, expected) => {
      expect(
        recommendAction([card(a), card(b)], card(up), {
          ...rules,
          hitSoft17: true,
        }),
      ).toBe(expected);
    },
  );
  it.each([
    ['10', '6', '9'],
    ['10', '6', '10'],
    ['10', '6', 'A'],
    ['10', '5', '10'],
  ] as [Rank, Rank, Rank][])('late surrender: %s,%s vs %s', (a, b, up) => {
    expect(
      recommendAction([card(a), card(b)], card(up), {
        ...rules,
        surrender: true,
      }),
    ).toBe('surrender');
  });
  it('splits 8s rather than surrendering except against an H17 Ace', () => {
    expect(
      recommendAction([card('8'), card('8')], card('A'), {
        ...rules,
        surrender: true,
      }),
    ).toBe('split');
    expect(
      recommendAction([card('8'), card('8')], card('A'), {
        ...rules,
        surrender: true,
        hitSoft17: true,
      }),
    ).toBe('surrender');
    for (const hand of [
      ['10', '5'],
      ['10', '7'],
    ] as [Rank, Rank][]) {
      expect(
        recommendAction(
          hand.map((rank) => card(rank)) as [Card, Card],
          card('A'),
          { ...rules, surrender: true, hitSoft17: true },
        ),
      ).toBe('surrender');
    }
  });
  it('prescribes legal actions for every initial hand under all eight rule combinations', () => {
    for (const doubleAfterSplit of [false, true])
      for (const hitSoft17 of [false, true])
        for (const surrender of [false, true]) {
          for (const a of RANKS)
            for (const b of RANKS)
              for (const dealer of RANKS) {
                const action = recommendAction(
                  [card(a), card(b)],
                  card(dealer),
                  { doubleAfterSplit, hitSoft17, surrender },
                );
                expect([
                  'hit',
                  'stand',
                  'double',
                  'split',
                  'surrender',
                ]).toContain(action);
                if (action === 'split')
                  expect(value(card(a))).toBe(value(card(b)));
                if (action === 'surrender') expect(surrender).toBe(true);
              }
        }
  });
});
describe('independent card draws and preferences', () => {
  it('maps 52 equal-sized random intervals to 52 distinct cards, without removing any', () => {
    const cards = Array.from({ length: 52 }, (_, i) =>
      drawInfiniteCard(() => (i + 0.5) / 52, i),
    );
    expect(new Set(cards.map((c) => c.rank + c.suit)).size).toBe(52);
    expect(cards.filter((c) => value(c) === 10)).toHaveLength(16);
    expect(drawInfiniteCard(() => 0, 1)).toMatchObject(
      drawInfiniteCard(() => 0, 1),
    );
  });
  it('skips naturals without altering the independent draw function', () => {
    const values = [0, 0.99, 0.1, 0.1, 0.5];
    const question = dealQuestion(() => values.shift()!, 7);
    expect(question.cards.map((c) => c.rank)).toEqual(['2', '2']);
    expect(question.id).toBe(7);
  });
  it('validates settings independently from Free Play preferences', () => {
    expect(parseStrategySettings(null)).toEqual(DEFAULT_STRATEGY_SETTINGS);
    expect(
      parseStrategySettings({
        options: { seconds: Infinity, timedHands: 'yes' },
        rules: { surrender: true },
      }),
    ).toEqual({
      rules: { ...rules, surrender: true },
      options: DEFAULT_STRATEGY_SETTINGS.options,
    });
  });
  it('defaults old or invalid difficulty preferences to Normal and retains Difficult', () => {
    for (const difficulty of [undefined, null, 'hard', true])
      expect(
        parseStrategySettings({ options: { difficulty } }).options.difficulty,
      ).toBe('normal');
    expect(
      parseStrategySettings({ options: { difficulty: 'difficult' } }).options
        .difficulty,
    ).toBe('difficult');
  });
});
