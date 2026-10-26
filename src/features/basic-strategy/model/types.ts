import type { Card, PlayerAction } from '../../blackjack/model/types';
import type { BasicStrategyStats } from '../../stats/sessionStats';

export interface StrategyRules {
  doubleAfterSplit: boolean;
  hitSoft17: boolean;
  surrender: boolean;
}
export type StrategyDifficulty = 'normal' | 'difficult';
export type StrategyHandType = 'hard' | 'soft' | 'pair' | 'all';
export interface StrategyOptions {
  skipExplanations: boolean;
  difficulty: StrategyDifficulty;
  handType: StrategyHandType;
  timedHands: boolean;
  seconds: number;
}
export interface StrategySettings {
  rules: StrategyRules;
  options: StrategyOptions;
}
export interface StrategyQuestion {
  id: number;
  cards: [Card, Card];
  dealer: Card;
}
export type StrategyPanel =
  'menu' | 'setup' | 'rules' | 'options' | 'reset' | 'help' | null;
export interface StrategyFeedback {
  correct: boolean;
  selected: PlayerAction | null;
  expected: PlayerAction;
  explanation: string;
  timedOut: boolean;
}
export interface StrategyState {
  started: boolean;
  panel: StrategyPanel;
  phase: 'idle' | 'answering' | 'feedback' | 'review';
  question: StrategyQuestion | null;
  feedback: StrategyFeedback | null;
  stats: BasicStrategyStats;
}
export interface StrategySnapshot {
  state: StrategyState;
  settings: StrategySettings;
  draft: StrategySettings | null;
  timerSeconds: number | null;
}
