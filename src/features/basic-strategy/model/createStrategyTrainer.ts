import { value } from '../../blackjack/model/cards';
import type { PlayerAction } from '../../blackjack/model/types';
import { createDecisionTrainer } from '../../training/model/createDecisionTrainer';
import { dealDifficultQuestion, dealQuestion } from './questions';
import { recommendAction, explainDecision } from './strategy';
import { strategySettingsRepository, parseStrategySettings } from './settings';
import type { StrategySettingsRepository } from './settings';
import type { StrategyOptions, StrategyQuestion, StrategyRules } from './types';

export { FEEDBACK_MS } from '../../training/model/createDecisionTrainer';
export function createStrategyTrainer(
  dependencies: {
    random?: () => number;
    settings?: StrategySettingsRepository;
    question?: (id: number) => StrategyQuestion;
  } = {},
) {
  return createDecisionTrainer<
    StrategyRules,
    StrategyOptions,
    StrategyQuestion,
    PlayerAction,
    'basic-strategy'
  >(
    {
      modeId: 'basic-strategy',
      settings: strategySettingsRepository,
      parseSettings: parseStrategySettings,
      dealQuestion: (random, id, settings) =>
        settings.options.difficulty === 'difficult'
          ? dealDifficultQuestion(random, id, settings.rules)
          : dealQuestion(random, id),
      recommendAction: (question, rules) =>
        recommendAction(question.cards, question.dealer, rules),
      explainDecision: (question, rules) =>
        explainDecision(question.cards, question.dealer, rules),
      canAnswer: (question, action, rules) =>
        action === 'surrender'
          ? rules.surrender
          : action === 'split'
            ? value(question.cards[0]) === value(question.cards[1])
            : true,
      optionChange: (key) => (key === 'difficulty' ? 'replace' : 'timer'),
    },
    dependencies,
  );
}
export type StrategyTrainer = ReturnType<typeof createStrategyTrainer>;
