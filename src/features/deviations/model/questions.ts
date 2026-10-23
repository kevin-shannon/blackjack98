import { drawInfiniteCard } from '../../basic-strategy/model/questions';
import type { Card, Rank, Suit } from '../../blackjack/model/types';
import { DEVIATION_INDICES, thresholdFor } from './indices';
import type { DeviationQuestion, DeviationSettings } from './types';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const NUMBERS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];
export function dealDeviationQuestion(
  random: () => number,
  id: number,
  settings: DeviationSettings,
): DeviationQuestion {
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(random() * items.length)];
  const pool = DEVIATION_INDICES.filter(
    (index) =>
      settings.options.set === 'both' || index.set === settings.options.set,
  );
  const index = pick(pool);
  // Independent coin flip: exactly at the threshold or one integer below it.
  const trueCount =
    thresholdFor(index, settings.rules) - (random() < 0.5 ? 1 : 0);
  const makeCard = (rank: Rank, cardId: number): Card => ({
    rank: rank === '10' ? pick(['10', 'J', 'Q', 'K'] as const) : rank,
    suit: pick(SUITS),
    id: cardId,
  });
  let cards: [Card, Card];
  if (index.total === 'insurance') {
    // Only the insurance decision is graded; the player cards do not affect it.
    cards = [
      drawInfiniteCard(random, id * 3),
      drawInfiniteCard(random, id * 3 + 1),
    ];
  } else if (index.total === 'tens') {
    cards = [makeCard('10', id * 3), makeCard('10', id * 3 + 1)];
  } else {
    const compositions: [Rank, Rank][] = [];
    for (let a = 0; a < NUMBERS.length; a++)
      for (let b = a + 1; b < NUMBERS.length; b++)
        if (Number(NUMBERS[a]) + Number(NUMBERS[b]) === index.total)
          compositions.push([NUMBERS[a], NUMBERS[b]]);
    const ranks = pick(compositions);
    cards = [makeCard(ranks[0], id * 3), makeCard(ranks[1], id * 3 + 1)];
    if (random() < 0.5) cards.reverse();
  }
  return {
    id,
    cards,
    dealer: makeCard(index.dealer, id * 3 + 2),
    indexId: index.id,
    trueCount,
  };
}
