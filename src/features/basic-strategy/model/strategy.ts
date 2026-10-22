import { score, value } from '../../blackjack/model/cards';
import type { Card, PlayerAction } from '../../blackjack/model/types';
import type { StrategyRules } from './types';

export const ACTION_LABELS: Record<PlayerAction, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
};
/** Standard total-dependent multi-deck strategy, dealer peek, double on any initial two cards.
 * Source and rule variations: https://wizardofodds.com/games/blackjack/strategy/4-decks/
 * Every drill is an initial decision; no counting deviations or post-split hands are graded.
 */
export function recommendAction(
  cards: readonly [Card, Card],
  dealer: Card,
  rules: StrategyRules,
): PlayerAction {
  const { total, soft } = score([...cards]);
  const up = value(dealer),
    pair = value(cards[0]) === value(cards[1]),
    rank = value(cards[0]);
  // Late surrender is considered before splitting, including H17's 8,8 vs Ace exception.
  if (
    rules.surrender &&
    !soft &&
    ((total === 16 && !pair && [9, 10, 11].includes(up)) ||
      (total === 15 && (up === 10 || (rules.hitSoft17 && up === 11))) ||
      (rules.hitSoft17 && up === 11 && (total === 17 || (pair && rank === 8))))
  )
    return 'surrender';
  if (pair) {
    if (rank === 11 || rank === 8) return 'split';
    if (
      (rank === 2 || rank === 3) &&
      up >= (rules.doubleAfterSplit ? 2 : 4) &&
      up <= 7
    )
      return 'split';
    if (rank === 4 && rules.doubleAfterSplit && [5, 6].includes(up))
      return 'split';
    if (rank === 6 && up >= (rules.doubleAfterSplit ? 2 : 3) && up <= 6)
      return 'split';
    if (rank === 7 && up >= 2 && up <= 7) return 'split';
    if (rank === 9 && [2, 3, 4, 5, 6, 8, 9].includes(up)) return 'split';
  }
  if (soft) {
    if ([13, 14].includes(total) && [5, 6].includes(up)) return 'double';
    if ([15, 16].includes(total) && up >= 4 && up <= 6) return 'double';
    if ([17, 18].includes(total) && up >= 3 && up <= 6) return 'double';
    if (
      rules.hitSoft17 &&
      ((total === 18 && up === 2) || (total === 19 && up === 6))
    )
      return 'double';
    if (total >= 19 || (total === 18 && up <= 8)) return 'stand';
    return 'hit';
  }
  if (total === 9 && up >= 3 && up <= 6) return 'double';
  if (total === 10 && up <= 9) return 'double';
  if (total === 11 && (up !== 11 || rules.hitSoft17)) return 'double';
  if (
    total >= 17 ||
    (total >= 13 && up <= 6) ||
    (total === 12 && up >= 4 && up <= 6)
  )
    return 'stand';
  return 'hit';
}
export function explainDecision(
  cards: [Card, Card],
  dealer: Card,
  rules: StrategyRules,
) {
  const result = score(cards),
    pair = value(cards[0]) === value(cards[1]);
  const hand = pair
    ? `Pair of ${cards[0].rank === 'A' ? 'aces' : value(cards[0]) === 10 ? 'tens' : `${cards[0].rank}s`}`
    : `${result.soft ? 'Soft' : 'Hard'} ${result.total}`;
  return `${hand} vs dealer ${dealer.rank}: ${ACTION_LABELS[recommendAction(cards, dealer, rules)].toLowerCase()}.`;
}
