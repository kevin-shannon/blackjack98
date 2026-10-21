import type { Card, Hand } from './types';
export const clamp = (n: number, low: number, high: number) =>
  Math.max(low, Math.min(high, n));
export function value(card: Pick<Card, 'rank'>) {
  return card.rank === 'A'
    ? 11
    : ['10', 'J', 'Q', 'K'].includes(card.rank)
      ? 10
      : Number(card.rank);
}
export function score(cards: Pick<Card, 'rank'>[]) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += value(card);
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces) {
    total -= 10;
    aces--;
  }
  return {
    total,
    soft: aces > 0,
    blackjack: cards.length === 2 && total === 21,
  };
}
export function natural(hand: Hand) {
  return !hand.fromSplit && score(hand.cards).blackjack;
}
export function hiLo(card: Pick<Card, 'rank'>) {
  return ['2', '3', '4', '5', '6'].includes(card.rank)
    ? 1
    : ['10', 'J', 'Q', 'K', 'A'].includes(card.rank)
      ? -1
      : 0;
}
