import type { PracticeStats } from '../../stats/sessionStats';

export type PracticePanel =
  'menu' | 'setup' | 'rules' | 'options' | 'reset' | 'help' | null;
export interface TimedPracticeOptions {
  skipExplanations: boolean;
  timedHands: boolean;
  seconds: number;
}
export interface PracticeSettings<Rules, Options> {
  rules: Rules;
  options: Options;
}
export interface PracticeSettingsRepository<Settings> {
  load(): Settings;
  save(settings: Settings): void;
}
export interface PracticeFeedback<Action> {
  correct: boolean;
  selected: Action | null;
  expected: Action;
  explanation: string;
  timedOut: boolean;
}
export interface PracticeState<Question, Action, Mode extends string> {
  started: boolean;
  panel: PracticePanel;
  phase: 'idle' | 'answering' | 'feedback' | 'review';
  question: Question | null;
  feedback: PracticeFeedback<Action> | null;
  stats: PracticeStats<Mode>;
}
export interface PracticeSnapshot<
  Rules,
  Options,
  Question,
  Action,
  Mode extends string,
> {
  state: PracticeState<Question, Action, Mode>;
  settings: PracticeSettings<Rules, Options>;
  draft: PracticeSettings<Rules, Options> | null;
  timerSeconds: number | null;
}
