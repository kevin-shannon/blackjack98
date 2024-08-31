export enum Suit {
  HEART = "Heart",
  DIAMOND = "Diamond",
  CLUB = "Club",
  SPADE = "Spade",
}

export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export type Card = { suit: Suit; rank: Rank } | { suit: "Hidden"; rank: "Hidden" };

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
