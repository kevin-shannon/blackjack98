export enum Suit {
  HEART = "Heart",
  DIAMOND = "Diamond",
  CLUB = "Club",
  SPADE = "Spade",
}

export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Action {
  actionName: string;
  src: string;
}

export const actions: Action[] = [
  { actionName: "double", src: "2x.png" },
  { actionName: "surrender", src: "surrender.png" },
  { actionName: "hit", src: "hit.png" },
  { actionName: "split", src: "split.png" },
  { actionName: "stand", src: "stand.png" },
  { actionName: "insurance", src: "insurance.png" },
];
