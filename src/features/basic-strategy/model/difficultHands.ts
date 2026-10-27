import { score } from '../../blackjack/model/cards';
import type { Card, PlayerAction, Rank } from '../../blackjack/model/types';
import { recommendAction } from './strategy';
import type { StrategyRules } from './types';

type Composition = readonly [Rank, Rank];
interface PlayerRow {
  readonly family: 'hard' | 'soft' | 'pair';
  readonly total: number;
  readonly compositions: readonly Composition[];
}
export interface DifficultHand extends PlayerRow {
  readonly dealerRank: Rank;
}
const NUMERIC_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];
const DEALER_RANKS: Rank[] = [...NUMERIC_RANKS, 'A'];
const card = (rank: Rank): Card => ({ rank, suit: 'S', id: 0 });

// Hard totals use non-pair compositions; pairs have their own chart rows.
const hardRows: PlayerRow[] = Array.from({ length: 15 }, (_, i) => {
  const total = i + 5;
  const compositions: Composition[] = [];
  for (let a = 0; a < NUMERIC_RANKS.length; a++)
    for (let b = a + 1; b < NUMERIC_RANKS.length; b++)
      if (Number(NUMERIC_RANKS[a]) + Number(NUMERIC_RANKS[b]) === total)
        compositions.push([NUMERIC_RANKS[a], NUMERIC_RANKS[b]]);
  return { family: 'hard', total, compositions };
});
const softRows: PlayerRow[] = NUMERIC_RANKS.slice(0, -1).map((rank) => ({
  family: 'soft',
  total: 11 + Number(rank),
  compositions: [['A', rank]],
}));
const pairRows: PlayerRow[] = DEALER_RANKS.map((rank) => ({
  family: 'pair',
  total: score([card(rank), card(rank)]).total,
  compositions: [[rank, rank]],
}));
const pools = new Map<string, readonly DifficultHand[]>();
const isRoutineRow = (row: PlayerRow) =>
  (row.family === 'hard' && [8, 11, 17].includes(row.total)) ||
  (row.family === 'pair' &&
    ['5', '8', '10', 'A'].includes(row.compositions[0][0]));

/** Both sides of each action boundary qualify, across dealer upcards and player rows.
 * Routine rows retain dealer-upcard boundaries and one eligible example per action.
 * See docs/basic-strategy-edge-cases.md for all eight rule-specific lists.
 */
export function getDifficultHands(
  rules: StrategyRules,
): readonly DifficultHand[] {
  const key = `${rules.doubleAfterSplit}/${rules.hitSoft17}/${rules.surrender}`;
  const cached = pools.get(key);
  if (cached) return cached;
  const pool: DifficultHand[] = [];
  for (const rows of [hardRows, softRows, pairRows]) {
    const actions = rows.map((row) =>
      DEALER_RANKS.map((dealer) =>
        recommendAction(
          row.compositions[0].map(card) as [Card, Card],
          card(dealer),
          rules,
        ),
      ),
    );
    rows.forEach((row, r) => {
      const eligible: number[] = [];
      const dealerBoundaries = new Set<number>();
      DEALER_RANKS.forEach((_, c) => {
        const neighbors: (PlayerAction | undefined)[] = [
          actions[r][c - 1],
          actions[r][c + 1],
        ];
        neighbors.push(actions[r - 1]?.[c], actions[r + 1]?.[c]);
        if (neighbors.some((action) => action && action !== actions[r][c]))
          eligible.push(c);
        if (
          neighbors
            .slice(0, 2)
            .some((action) => action && action !== actions[r][c])
        )
          dealerBoundaries.add(c);
      });
      let retained = eligible;
      if (isRoutineRow(row)) {
        const keep = new Set(dealerBoundaries);
        for (const action of new Set(eligible.map((c) => actions[r][c]))) {
          // Prefer dealer 6 for the representative, using only existing edge cells.
          const candidates = eligible.filter((c) => actions[r][c] === action);
          keep.add(
            candidates.reduce((best, c) =>
              Math.abs(c - 4) < Math.abs(best - 4) ? c : best,
            ),
          );
        }
        retained = eligible.filter((c) => keep.has(c));
      }
      retained.forEach((c) =>
        pool.push({ ...row, dealerRank: DEALER_RANKS[c] }),
      );
    });
  }
  pools.set(key, pool);
  return pool;
}
