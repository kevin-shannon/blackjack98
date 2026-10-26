import { RANKS } from '../../blackjack/model/constants';
import { score, value } from '../../blackjack/model/cards';
import type { Card, Rank, Suit } from '../../blackjack/model/types';
import { getDifficultHands } from './difficultHands';
import type {
  StrategyHandType,
  StrategyQuestion,
  StrategyRules,
} from './types';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
// Every ordered rank combination has 16 equally likely suit combinations.
// Sampling within a family preserves Normal's conditional card distribution.
const normalHands: Record<Exclude<StrategyHandType, 'all'>, [Rank, Rank][]> = {
  hard: [],
  soft: [],
  pair: [],
};
for (const first of RANKS)
  for (const second of RANKS) {
    const cards: [Card, Card] = [
      { rank: first, suit: 'S', id: 0 },
      { rank: second, suit: 'S', id: 1 },
    ];
    const result = score(cards);
    if (result.blackjack) continue;
    const family =
      value(cards[0]) === value(cards[1])
        ? 'pair'
        : result.soft
          ? 'soft'
          : 'hard';
    normalHands[family].push([first, second]);
  }
/** Each of the 52 physical cards has probability 1/52 on every independent draw. */
export function drawInfiniteCard(random: () => number, id: number): Card {
  const index = Math.floor(random() * 52);
  return { rank: RANKS[Math.floor(index / 4)], suit: SUITS[index % 4], id };
}
export function dealQuestion(
  random: () => number,
  id: number,
  handType: StrategyHandType = 'all',
): StrategyQuestion {
  if (handType !== 'all') {
    const choices = normalHands[handType];
    const ranks = choices[Math.floor(random() * choices.length)];
    const card = (rank: Rank, cardId: number): Card => ({
      rank,
      suit: SUITS[Math.floor(random() * SUITS.length)],
      id: cardId,
    });
    return {
      id,
      cards: [card(ranks[0], id * 3), card(ranks[1], id * 3 + 1)],
      dealer: drawInfiniteCard(random, id * 3 + 2),
    };
  }
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
  handType: StrategyHandType = 'all',
): StrategyQuestion {
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)];
  const pool = getDifficultHands(rules);
  const hand = pick(
    handType === 'all' ? pool : pool.filter((cell) => cell.family === handType),
  );
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
