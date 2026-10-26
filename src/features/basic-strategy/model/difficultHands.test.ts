import { describe, expect, it } from 'vitest';
import { score, value } from '../../blackjack/model/cards';
import { getDifficultHands } from './difficultHands';
import { dealDifficultQuestion } from './questions';
import type { StrategyRules } from './types';

// Counts independently calculated in the agreed eight-table design analysis.
const configurations = [
  [false, false, false, 55, 38, 76],
  [false, false, true, 59, 38, 76],
  [false, true, false, 55, 38, 72],
  [false, true, true, 59, 38, 72],
  [true, false, false, 57, 41, 76],
  [true, false, true, 62, 41, 76],
  [true, true, false, 57, 41, 72],
  [true, true, true, 62, 41, 72],
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
          pool.map(
            (hand) =>
              `${hand.family}/${hand.compositions[0].join(',')}/${hand.dealerRank}`,
          ),
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
    it('includes player-row boundaries for pairs without adding non-boundary cells', () => {
      const pairs = getDifficultHands(rules).filter(
        (hand) => hand.family === 'pair',
      );
      const contains = (rank: string, dealerRank: string) =>
        pairs.some(
          (hand) =>
            hand.compositions[0][0] === rank && hand.dealerRank === dealerRank,
        );
      // These adjacent rows disagree for every upcard: tens stand, Aces split.
      for (const rank of ['A', '10'])
        expect(
          pairs.filter((hand) => hand.compositions[0][0] === rank),
        ).toHaveLength(10);
      // 4,4 and 5,5 have a vertical action boundary against dealer 4.
      expect(contains('4', '4')).toBe(true);
      expect(contains('5', '4')).toBe(true);
      // At 2,2 vs 2, all existing neighbors prescribe the same action.
      expect(contains('2', '2')).toBe(false);
      // 3,3 vs 2 borders 4,4's Hit only when DAS enables splitting 3,3.
      expect(contains('3', '2')).toBe(doubleAfterSplit);
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
