import type { PlayerAction } from '../blackjack/model/types';
import { DecisionPractice } from '../training/components/DecisionPractice';
import { ACTION_LABELS } from './model/strategy';
import { useStrategyTrainer } from './hooks/useStrategyTrainer';
import { StrategyDialogs } from './components/StrategyDialogs';
import type { StrategyQuestion } from './model/types';

export function BasicStrategy() {
  const { trainer, state, settings, timerSeconds } = useStrategyTrainer();
  const entries: [PlayerAction, string][] = [
    ['hit', 'H'],
    ['stand', 'S'],
    ['double', 'D'],
    ['split', 'P'],
  ];
  if (settings.rules.surrender) entries.push(['surrender', 'R']);
  return (
    <>
      <DecisionPractice<StrategyQuestion, PlayerAction, 'basic-strategy'>
        trainer={trainer}
        state={state}
        timerSeconds={timerSeconds}
        title="BASIC STRATEGY"
        name="Basic Strategy"
        rulesSummary={[
          'INFINITE DECK',
          settings.rules.hitSoft17 ? 'HIT SOFT 17' : 'STAND SOFT 17',
          settings.rules.doubleAfterSplit ? 'DAS' : 'NO DAS',
          ...(settings.rules.surrender ? ['SURRENDER'] : []),
        ].join(' \u00b7 ')}
        actions={entries.map(([action, key]) => ({
          action,
          key,
          label: ACTION_LABELS[action],
        }))}
        prompt="Choose the correct basic strategy action."
      />
      <StrategyDialogs />
    </>
  );
}
