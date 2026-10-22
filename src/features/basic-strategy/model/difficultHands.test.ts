import { describe, expect, it } from 'vitest';
import { score, value } from '../../blackjack/model/cards';
import { getDifficultHands } from './difficultHands';
import { dealDifficultQuestion } from './questions';
import type { StrategyRules } from './types';

// Counts independently calculated in the agreed eight-table design analysis.
const configurations = [
  [false, false, false, 55, 38, 21],
  [false, false, true, 59, 38, 21],
  [false, true, false, 55, 38, 19],
  [false, true, true, 59, 38, 19],
  [true, false, false, 57, 41, 21],
  [true, false, true, 62, 41, 23],
  [true, true, false, 57, 41, 19],
  [true, true, true, 62, 41, 21],
] as const;

describe.each(configurations)(
  'Difficult pool: H17=%s, DAS=%s, surrender=%s',
  (hitSoft17, doubleAfterSplit, surrender, hard, soft, pair) => {
    const rules = { hitSoft17, doubleAfterSplit, surrender };
    it('matches the agreed number of cells in each hand family', () => {
      const pool = getDifficultHands(rules);
      expect(pool.filter((hand) => hand.family === 'hard')).toHaveLength(hard);
      expect(pool.filter((hand) => hand.family === 'soft')).toHaveLength(soft);
      expect(pool.filter((hand) => hand.family === 'pair')).toHaveLength(pair);
      expect(
        new Set(
          pool.map((hand) => `${hand.family}/${hand.total}/${hand.dealerRank}`),
        ).size,
      ).toBe(pool.length);
    });
    it('gives every eligible cell an equal random interval and deals a matching playable hand', () => {
      const pool = getDifficultHands(rules);
      let seed = 42;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 2 ** 32;
      };
      pool.forEach((cell, index) => {
        // Selecting the center of each equally sized interval must reach that cell.
        let firstDraw = true;
        const question = dealDifficultQuestion(
          () => {
            if (firstDraw) {
              firstDraw = false;
              return (index + 0.5) / pool.length;
            }
            return random();
          },
          index + 1,
          rules,
        );
        const result = score(question.cards);
        const isPair = value(question.cards[0]) === value(question.cards[1]);
        expect(isPair ? 'pair' : result.soft ? 'soft' : 'hard').toBe(
          cell.family,
        );
        expect(result.total).toBe(cell.total);
        expect(value(question.dealer)).toBe(value({ rank: cell.dealerRank }));
        expect(result.blackjack).toBe(false);
        expect(
          new Set([...question.cards, question.dealer].map((c) => c.id)).size,
        ).toBe(3);
      });
    });
    it('excludes pairs of aces and tens because pair rows only compare dealer upcards', () => {
      const pairs = getDifficultHands(rules).filter(
        (hand) => hand.family === 'pair',
      );
      expect(
        pairs.some((hand) => ['A', '10'].includes(hand.compositions[0][0])),
      ).toBe(false);
      const eights = pairs.filter((hand) => hand.compositions[0][0] === '8');
      expect(eights.map((hand) => hand.dealerRank)).toEqual(
        hitSoft17 && surrender ? ['10', 'A'] : [],
      );
    });
  },
);

it('includes both sides of boundaries and keeps non-boundary surrender cells out', () => {
  const rules: StrategyRules = {
    hitSoft17: false,
    doubleAfterSplit: true,
    surrender: false,
  };
  const contains = (
    rules: StrategyRules,
    family: 'hard' | 'soft',
    total: number,
    dealerRank: string,
  ) =>
    getDifficultHands(rules).some(
      (hand) =>
        hand.family === family &&
        hand.total === total &&
        hand.dealerRank === dealerRank,
    );
  expect(contains(rules, 'hard', 8, '6')).toBe(true);
  expect(contains(rules, 'hard', 9, '6')).toBe(true);
  expect(contains(rules, 'soft', 18, '2')).toBe(true);
  expect(contains(rules, 'hard', 6, '6')).toBe(false);
  expect(
    contains({ ...rules, hitSoft17: true, surrender: true }, 'hard', 16, 'A'),
  ).toBe(false);
  expect(
    contains({ ...rules, hitSoft17: true, surrender: true }, 'hard', 18, 'A'),
  ).toBe(true);
});
