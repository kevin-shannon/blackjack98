export enum Suit {
  HEART = "Heart",
  DIAMOND = "Diamond",
  CLUB = "Club",
  SPADE = "Spade",
}

export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export type Card = ({ suit: Suit; rank: Rank } | { suit: "Hidden"; rank: "Hidden" }) & { isDoubled?: boolean };

export const hiddenCard: Card = { suit: "Hidden", rank: "Hidden" };

export type Deck = Array<Card>;

export enum Action {
  HIT = "Hit",
  STAND = "Stand",
  DOUBLE = "Double",
  SURRENDER = "Surrender",
  INSURANCE = "Insurance",
  SPLIT = "Split",
}

const fillActions = (start: number, end: number, action: Action) => {
  const result: { [dealerUpcard: number]: Action } = {};
  for (let i = start; i <= end; i++) {
    result[i] = action;
  }
  return result;
};

// Use the helper to populate the hard strategy
const hardStrategy: { [playerTotal: number]: { [dealerUpcard: number]: Action } } = {
  5: fillActions(2, 11, Action.HIT),
  6: fillActions(2, 11, Action.HIT),
  7: fillActions(2, 11, Action.HIT),
  8: fillActions(2, 11, Action.HIT),
  9: { ...fillActions(2, 2, Action.HIT), ...fillActions(3, 6, Action.DOUBLE), ...fillActions(6, 11, Action.HIT) },
  10: {...fillActions(2, 9, Action.DOUBLE), ...fillActions(10, 11, Action.HIT)},
  11: fillActions(2, 11, Action.DOUBLE),
  12: {...fillActions(2, 3, Action.HIT), ...fillActions(4, 6, Action.STAND), ...fillActions(7, 11, Action.HIT)},
  13: {...fillActions(2, 6, Action.STAND), ...fillActions(7, 11, Action.HIT)},
  14: {...fillActions(2, 6, Action.STAND), ...fillActions(7, 11, Action.HIT)},
  15: {...fillActions(2, 6, Action.STAND), ...fillActions(7, 11, Action.HIT)},
  16: {...fillActions(2, 6, Action.STAND), ...fillActions(7, 11, Action.HIT)},
  17: fillActions(2, 11, Action.STAND),
  18: fillActions(2, 11, Action.STAND),
  19: fillActions(2, 11, Action.STAND),
  20: fillActions(2, 11, Action.STAND),
  21: fillActions(2, 11, Action.STAND),
};

console.log(hardStrategy);