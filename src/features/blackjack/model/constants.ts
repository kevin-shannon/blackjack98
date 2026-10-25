import type { GameOptions, Rank, Suit, TableRules } from './types';
export const STARTING_BANKROLL = 1000;
export const MIN_BET = 5;
export const MAX_BET = 500;
export const MAX_HANDS = 4;
export const DEAL_DELAY = 175;
export const CHIPS = [5, 25, 50, 100, 500] as const;
export const SUIT_SYMBOL: Record<Suit, string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};
export const SUIT_NAMES: Record<Suit, string> = {
  S: 'spades',
  H: 'hearts',
  D: 'diamonds',
  C: 'clubs',
};
export const RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];
export const DEFAULT_RULES: TableRules = {
  decks: 6,
  penetration: 75,
  doubleAfterSplit: true,
  hitSoft17: true,
  resplitAces: false,
  surrender: false,
  payout: '3:2',
};
export const DEFAULT_OPTIONS: GameOptions = {
  stakes: 'custom',
  startingBankroll: STARTING_BANKROLL,
  minBet: MIN_BET,
  maxBet: MAX_BET,
  timedHands: false,
  seconds: 10,
};
