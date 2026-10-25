import type { PlayerAction } from '../blackjack/model/types';
import { DecisionPractice } from '../training/components/DecisionPractice';
import { ACTION_LABELS } from './model/strategy';
import { useStrategyTrainer } from './hooks/useStrategyTrainer';
import { StrategyDialogs } from './components/StrategyDialogs';
import type { StrategyQuestion } from './model/types';
import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '../../shared/ui/ActionButton';
import { StrategyChart } from './components/StrategyChart';

export function BasicStrategy() {
  const { trainer, state, settings, timerSeconds } = useStrategyTrainer();
  const [chartQuestion, setChartQuestion] = useState<StrategyQuestion | null>(
    null,
  );
  const chartOpen = Boolean(
    chartQuestion &&
    chartQuestion.id === state.question?.id &&
    state.phase === 'review' &&
    !state.panel,
  );
  const chartButtonRef = useRef<HTMLButtonElement>(null);
  const wasChartOpen = useRef(false);
  useEffect(() => {
    if (
      wasChartOpen.current &&
      !chartOpen &&
      state.phase === 'review' &&
      !state.panel
    ) {
      chartButtonRef.current?.focus();
    }
    wasChartOpen.current = chartOpen;
  }, [chartOpen, state.phase, state.panel]);
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
        reviewModalOpen={chartOpen}
        reviewActions={
          <ActionButton
            ref={chartButtonRef}
            onClick={() => setChartQuestion(state.question)}
          >
            Show strategy chart
          </ActionButton>
        }
        rulesSummary={[
          settings.rules.hitSoft17 ? 'H17' : 'S17',
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
      {chartOpen && chartQuestion && (
        <StrategyChart
          question={chartQuestion}
          rules={settings.rules}
          onClose={() => setChartQuestion(null)}
        />
      )}
    </>
  );
}
