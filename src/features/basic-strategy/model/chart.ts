import { score, value } from '../../blackjack/model/cards';
import type { Card, Rank } from '../../blackjack/model/types';
import { recommendAction } from './strategy';
import type { StrategyQuestion, StrategyRules } from './types';

export type ChartFamily = 'Hard' | 'Soft' | 'Pair';
export const CHART_DEALERS: Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'A',
];
const card = (rank: Rank): Card => ({ rank, suit: 'S', id: 0 });

export function getStrategyChart(
  question: StrategyQuestion,
  rules: StrategyRules,
) {
  const hand = score(question.cards);
  const paired = value(question.cards[0]) === value(question.cards[1]);
  const family: ChartFamily = paired ? 'Pair' : hand.soft ? 'Soft' : 'Hard';
  const selectedRow = paired ? value(question.cards[0]) : hand.total;
  const dealer = value(question.dealer);
  const totals =
    family === 'Hard'
      ? Array.from({ length: 16 }, (_, i) => 20 - i)
      : family === 'Soft'
        ? Array.from({ length: 8 }, (_, i) => 20 - i)
        : [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const rows = totals.map((total) => {
    const ranks: [Rank, Rank] =
      family === 'Pair'
        ? [
            total === 11 ? 'A' : (String(total) as Rank),
            total === 11 ? 'A' : (String(total) as Rank),
          ]
        : family === 'Soft'
          ? ['A', String(total - 11) as Rank]
          : total >= 12
            ? [String(total - 10) as Rank, '10']
            : ['2', String(total - 2) as Rank];
    const label =
      family === 'Pair'
        ? ranks.join(',')
        : family === 'Soft'
          ? `A,${ranks[1]} (${total})`
          : String(total);
    return {
      total,
      label,
      actions: CHART_DEALERS.map((rank) =>
        recommendAction([card(ranks[0]), card(ranks[1])], card(rank), rules),
      ),
    };
  });
  return { family, selectedRow, dealer, rows };
}
