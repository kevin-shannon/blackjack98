import { value } from '../../blackjack/model/cards';
import { ACTION_LABELS } from '../../basic-strategy/model/strategy';
import { createDecisionTrainer } from '../../training/model/createDecisionTrainer';
import {
  getDeviationIndex,
  recommendDeviation,
  thresholdFor,
  signedCount,
} from './indices';
import { dealDeviationQuestion } from './questions';
import {
  deviationSettingsRepository,
  parseDeviationSettings,
} from './settings';
import type { DeviationSettingsRepository } from './settings';
import type {
  DeviationAction,
  DeviationOptions,
  DeviationQuestion,
  DeviationRules,
} from './types';

export const DEVIATION_ACTION_LABELS: Record<DeviationAction, string> = {
  ...ACTION_LABELS,
  insure: 'Take insurance',
  decline: 'Decline insurance',
};
export function createDeviationTrainer(
  dependencies: {
    random?: () => number;
    settings?: DeviationSettingsRepository;
    question?: (id: number) => DeviationQuestion;
  } = {},
) {
  return createDecisionTrainer<
    DeviationRules,
    DeviationOptions,
    DeviationQuestion,
    DeviationAction,
    'deviations'
  >(
    {
      modeId: 'deviations',
      settings: deviationSettingsRepository,
      parseSettings: parseDeviationSettings,
      dealQuestion: dealDeviationQuestion,
      recommendAction: recommendDeviation,
      explainDecision(question, rules) {
        const index = getDeviationIndex(question),
          threshold = thresholdFor(index, rules);
        const hand =
          index.total === 'insurance'
            ? 'Insurance'
            : index.total === 'tens'
              ? 'Pair of tens'
              : `Hard ${index.total}`;
        return `${hand} vs ${index.dealer}: ${DEVIATION_ACTION_LABELS[index.above]} at TC ${signedCount(threshold)} or above; otherwise ${DEVIATION_ACTION_LABELS[index.below].toLowerCase()}.`;
      },
      canAnswer(question, action) {
        const index = getDeviationIndex(question);
        if (index.total === 'insurance')
          return action === 'insure' || action === 'decline';
        if (action === 'insure' || action === 'decline') return false;
        if (action === 'surrender') return index.set === 'fab-4';
        if (action === 'split')
          return value(question.cards[0]) === value(question.cards[1]);
        return true;
      },
      optionChange: (key) => (key === 'set' ? 'reset' : 'timer'),
    },
    dependencies,
  );
}
export type DeviationTrainer = ReturnType<typeof createDeviationTrainer>;
