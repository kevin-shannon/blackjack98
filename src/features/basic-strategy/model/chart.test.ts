import { describe, expect, it } from 'vitest';
import { getStrategyChart } from './chart';
import type { StrategyQuestion, StrategyRules } from './types';
import type { Card, Rank } from '../../blackjack/model/types';

const card = (rank: Rank): Card => ({ rank, suit: 'S', id: 1 });
const question = (a: Rank, b: Rank, dealer: Rank): StrategyQuestion => ({
  id: 1,
  cards: [card(a), card(b)],
  dealer: card(dealer),
});
const base: StrategyRules = {
  hitSoft17: false,
  doubleAfterSplit: true,
  surrender: false,
};

describe('review strategy chart', () => {
  it('classifies pairs before soft or hard totals and groups ten-valued ranks', () => {
    expect(getStrategyChart(question('A', 'A', 'K'), base)).toMatchObject({
      family: 'Pair',
      selectedRow: 11,
      dealer: 10,
    });
    expect(getStrategyChart(question('J', 'Q', 'A'), base)).toMatchObject({
      family: 'Pair',
      selectedRow: 10,
      dealer: 11,
    });
    expect(getStrategyChart(question('A', '7', '2'), base)).toMatchObject({
      family: 'Soft',
      selectedRow: 18,
    });
    expect(getStrategyChart(question('10', '6', '10'), base)).toMatchObject({
      family: 'Hard',
      selectedRow: 16,
    });
  });
  it.each([false, true])(
    'shows rule-specific action boundaries with H17=%s',
    (hitSoft17) => {
      for (const doubleAfterSplit of [false, true])
        for (const surrender of [false, true]) {
          const rules = { hitSoft17, doubleAfterSplit, surrender };
          const hard = getStrategyChart(question('10', '6', '10'), rules);
          expect(hard.rows.find((row) => row.total === 16)!.actions[8]).toBe(
            surrender ? 'surrender' : 'hit',
          );
          const soft = getStrategyChart(question('A', '7', '2'), rules);
          expect(soft.rows.find((row) => row.total === 18)!.actions[0]).toBe(
            hitSoft17 ? 'double' : 'stand',
          );
          const pair = getStrategyChart(question('4', '4', '5'), rules);
          expect(pair.rows.find((row) => row.total === 4)!.actions[3]).toBe(
            doubleAfterSplit ? 'split' : 'hit',
          );
          const eights = getStrategyChart(question('8', '8', 'A'), rules);
          expect(eights.rows.find((row) => row.total === 8)!.actions[9]).toBe(
            hitSoft17 && surrender ? 'surrender' : 'split',
          );
        }
    },
  );
});
