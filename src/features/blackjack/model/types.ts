import type { FreePlayStats } from '../../stats/sessionStats';
export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank =
  'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export interface Card {
  suit: Suit;
  rank: Rank;
  id: number;
}
export type Payout = '3:2' | '6:5' | '1:1' | '2:1';
export interface TableRules {
  decks: number;
  penetration: number;
  doubleAfterSplit: boolean;
  hitSoft17: boolean;
  resplitAces: boolean;
  surrender: boolean;
  payout: Payout;
}
export interface GameOptions {
  stakes: 'small-fry' | 'average-joe' | 'high-roller' | 'custom';
  startingBankroll: number;
  minBet: number;
  maxBet: number;
  timedHands: boolean;
  seconds: number;
}
export interface Settings {
  rules: TableRules;
  options: GameOptions;
  chip: number;
}
export type SettingKey = keyof TableRules | keyof GameOptions;
export type Phase =
  'betting' | 'dealing' | 'insurance' | 'playing' | 'dealerTurn' | 'roundOver';
export type Panel =
  'menu' | 'setup' | 'rules' | 'options' | 'reset' | 'help' | null;
export type PlayerAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';
export type HandResult =
  'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK' | 'BUST' | 'SURRENDER';
export interface Hand {
  cards: Card[];
  bet: number;
  complete: boolean;
  status: '' | 'bust' | 'stand' | 'surrender';
  result: HandResult | '';
  payout: number;
  fromSplit: boolean;
  splitAces: boolean;
  doubled: boolean;
}
export interface GameState {
  stats: FreePlayStats;
  minBet: number;
  maxBet: number;
  bankroll: number;
  bet: number;
  phase: Phase;
  busy: boolean;
  modeStarted: boolean;
  panel: Panel;
  dealer: Card[];
  dealerRevealed: boolean;
  hands: Hand[];
  active: number;
  insuranceBet: number;
  round: number;
  roundStartBankroll: number;
  lastDealtId: number | null;
  message: string;
  netResult: number;
  runningCount: number;
  seen: Set<number>;
}
export interface GameSnapshot {
  state: GameState;
  rules: TableRules;
  roundRules: TableRules;
  options: GameOptions;
  draftRules: TableRules | null;
  draftOptions: GameOptions | null;
  shoeRemaining: number;
  shoeTotal: number;
  timerSeconds: number | null;
}
