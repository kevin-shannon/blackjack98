import { RANKS } from '../../blackjack/model/constants';
import { score } from '../../blackjack/model/cards';
import type { Card, Rank, Suit } from '../../blackjack/model/types';
import { getDifficultHands } from './difficultHands';
import type { StrategyQuestion, StrategyRules } from './types';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
/** Each of the 52 physical cards has probability 1/52 on every independent draw. */
export function drawInfiniteCard(random: () => number, id: number): Card {
  const index = Math.floor(random() * 52);
  return { rank: RANKS[Math.floor(index / 4)], suit: SUITS[index % 4], id };
}
export function dealQuestion(
  random: () => number,
  id: number,
): StrategyQuestion {
  let cards: [Card, Card];
  do {
    cards = [
      drawInfiniteCard(random, id * 3),
      drawInfiniteCard(random, id * 3 + 1),
    ];
  } while (score(cards).blackjack); // Naturals have no initial action to practice.
  return { id, cards, dealer: drawInfiniteCard(random, id * 3 + 2) };
}

/** Sample chart cells uniformly with replacement, then vary their presentation. */
export function dealDifficultQuestion(
  random: () => number,
  id: number,
  rules: StrategyRules,
): StrategyQuestion {
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)];
  const hand = pick(getDifficultHands(rules));
  const ranks = [...pick(hand.compositions)];
  if (random() < 0.5) ranks.reverse();
  const card = (rank: Rank, cardId: number): Card => ({
    rank: rank === '10' ? pick(['10', 'J', 'Q', 'K'] as const) : rank,
    suit: pick(SUITS),
    id: cardId,
  });
  return {
    id,
    cards: [card(ranks[0], id * 3), card(ranks[1], id * 3 + 1)],
    dealer: card(hand.dealerRank, id * 3 + 2),
  };
}
