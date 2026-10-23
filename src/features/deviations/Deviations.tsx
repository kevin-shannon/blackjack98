import { DecisionPractice } from '../training/components/DecisionPractice';
import type { PracticeAction } from '../training/components/DecisionPractice';
import { useDeviationTrainer } from './hooks/useDeviationTrainer';
import { DeviationDialogs } from './components/DeviationDialogs';
import { getDeviationIndex, signedCount } from './model/indices';
import { DEVIATION_ACTION_LABELS } from './model/createDeviationTrainer';
import type { DeviationAction, DeviationQuestion } from './model/types';

export function Deviations() {
  const { trainer, state, settings, timerSeconds } = useDeviationTrainer();
  const index = state.question && getDeviationIndex(state.question);
  const insurance = index?.total === 'insurance';
  const entries: [DeviationAction, string][] = insurance
    ? [
        ['insure', 'I'],
        ['decline', 'N'],
      ]
    : [
        ['hit', 'H'],
        ['stand', 'S'],
        ['double', 'D'],
        ['split', 'P'],
      ];
  if (index?.set === 'fab-4') entries.push(['surrender', 'R']);
  const actions: PracticeAction<DeviationAction>[] = entries.map(
    ([action, key]) => ({
      action,
      key,
      label: DEVIATION_ACTION_LABELS[action],
    }),
  );
  return (
    <>
      <DecisionPractice<DeviationQuestion, DeviationAction, 'deviations'>
        trainer={trainer}
        state={state}
        timerSeconds={timerSeconds}
        title="DEVIATIONS"
        name="Deviations"
        rulesSummary={`HI-LO · SIX-DECK INDICES · ${settings.rules.hitSoft17 ? 'HIT' : 'STAND'} SOFT 17`}
        actions={actions}
        prompt={
          insurance
            ? 'Take or decline insurance at this true count.'
            : 'Choose the correct action for this true count.'
        }
        questionTitle={insurance ? 'TAKE INSURANCE?' : "WHAT'S YOUR MOVE?"}
        extraMeta={
          <div className="deviation-count" aria-label="True count">
            <span>TRUE COUNT</span>
            <b>
              {state.question ? signedCount(state.question.trueCount) : '—'}
            </b>
          </div>
        }
        context={
          <div className="deviation-context">
            {index?.set === 'fab-4'
              ? 'FAB 4 · LATE SURRENDER'
              : 'ILLUSTRIOUS 18 · NO SURRENDER'}
          </div>
        }
      />
      <DeviationDialogs />
    </>
  );
}
