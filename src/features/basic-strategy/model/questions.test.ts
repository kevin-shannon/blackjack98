import { describe, expect, it } from 'vitest';
import { score, value } from '../../blackjack/model/cards';
import { dealQuestion, dealDifficultQuestion } from './questions';
import { getDifficultHands } from './difficultHands';
import { DEFAULT_STRATEGY_SETTINGS, parseStrategySettings } from './settings';
import type { StrategyHandType } from './types';

describe('hand-type practice filters', () => {
  it.each([
    ['hard', 120],
    ['soft', 16],
    ['pair', 25],
  ] as const)(
    'Normal %s samples the conditional card distribution',
    (handType, count) => {
      const compositions = new Set<string>();
      for (let index = 0; index < count; index++) {
        let calls = 0;
        const question = dealQuestion(
          () => (calls++ === 0 ? (index + 0.5) / count : 0.4),
          index,
          handType,
        );
        const result = score(question.cards);
        const paired = value(question.cards[0]) === value(question.cards[1]);
        expect(result.blackjack).toBe(false);
        expect(paired).toBe(handType === 'pair');
        if (!paired) expect(result.soft).toBe(handType === 'soft');
        compositions.add(question.cards.map((card) => card.rank).join(','));
        expect(
          new Set([...question.cards, question.dealer].map((card) => card.id))
            .size,
        ).toBe(3);
      }
      expect(compositions.size).toBe(count);
      if (handType === 'pair') {
        expect(compositions.has('A,A')).toBe(true);
        expect(compositions.has('Q,K')).toBe(true);
      }
    },
  );

  it('Tricky samples every eligible cell uniformly within the chosen family for all rulesets', () => {
    for (const hitSoft17 of [false, true])
      for (const doubleAfterSplit of [false, true])
        for (const surrender of [false, true]) {
          const rules = { hitSoft17, doubleAfterSplit, surrender };
          for (const handType of ['hard', 'soft', 'pair'] as const) {
            const cells = getDifficultHands(rules).filter(
              (cell) => cell.family === handType,
            );
            expect(cells.length).toBeGreaterThan(0);
            cells.forEach((cell, index) => {
              let calls = 0;
              const question = dealDifficultQuestion(
                () => (calls++ === 0 ? (index + 0.5) / cells.length : 0.4),
                index,
                rules,
                handType,
              );
              const result = score(question.cards);
              const paired =
                value(question.cards[0]) === value(question.cards[1]);
              expect(paired ? 'pair' : result.soft ? 'soft' : 'hard').toBe(
                handType,
              );
              expect(result.total).toBe(cell.total);
              expect(value(question.dealer)).toBe(
                value({ rank: cell.dealerRank }),
              );
            });
          }
        }
  });

  it('defaults old or invalid hand-type settings to All and retains valid choices', () => {
    for (const handType of [undefined, null, 'invalid', true])
      expect(
        parseStrategySettings({ options: { handType } }).options.handType,
      ).toBe('all');
    for (const handType of [
      'hard',
      'soft',
      'pair',
      'all',
    ] satisfies StrategyHandType[])
      expect(
        parseStrategySettings({ options: { handType } }).options.handType,
      ).toBe(handType);
    expect(DEFAULT_STRATEGY_SETTINGS.options.handType).toBe('all');
  });
});
