import type { Card, PlayerAction, Rank } from '../../blackjack/model/types';
import type {
  PracticeSnapshot,
  PracticeSettings,
  TimedPracticeOptions,
} from '../../training/model/types';

export type DeviationSet = 'illustrious-18' | 'fab-4';
export type DeviationAction = PlayerAction | 'insure' | 'decline';
export interface DeviationRules {
  hitSoft17: boolean;
}
export interface DeviationOptions extends TimedPracticeOptions {
  set: DeviationSet | 'both';
}
export type DeviationSettings = PracticeSettings<
  DeviationRules,
  DeviationOptions
>;
export interface DeviationIndex {
  readonly id: string;
  readonly set: DeviationSet;
  readonly total: number | 'tens' | 'insurance';
  readonly dealer: Rank;
  readonly s17: number;
  readonly h17: number;
  readonly above: DeviationAction;
  readonly below: DeviationAction;
}
export interface DeviationQuestion {
  id: number;
  cards: [Card, Card];
  dealer: Card;
  indexId: string;
  trueCount: number;
}
export type DeviationSnapshot = PracticeSnapshot<
  DeviationRules,
  DeviationOptions,
  DeviationQuestion,
  DeviationAction,
  'deviations'
>;
