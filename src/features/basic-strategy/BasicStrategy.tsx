import { useEffect } from 'react';
import { GameWindow } from '../../shared/ui/GameWindow';
import { ActionButton } from '../../shared/ui/ActionButton';
import { PlayingCard } from '../blackjack/components/PlayingCard';
import { score } from '../blackjack/model/cards';
import type { PlayerAction } from '../blackjack/model/types';
import { accuracy } from '../stats/sessionStats';
import { ACTION_LABELS } from './model/strategy';
import { useStrategyTrainer } from './hooks/useStrategyTrainer';
import { StrategyDialogs } from './components/StrategyDialogs';

const ACTIONS: PlayerAction[] = [
  'hit',
  'stand',
  'double',
  'split',
  'surrender',
];
export function BasicStrategy() {
  const { trainer, state, settings, timerSeconds } = useStrategyTrainer();
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.repeat
      )
        return;
      const target = event.target;
      const current = trainer.getSnapshot().state;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (current.panel === 'setup') trainer.backToMenu();
        else if (current.panel) trainer.closePanel();
        else trainer.openPanel('menu');
        return;
      }
      if (
        target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )
        return;
      const keys: Record<string, PlayerAction> = {
        h: 'hit',
        s: 'stand',
        d: 'double',
        p: 'split',
        r: 'surrender',
      };
      const action = keys[event.key.toLowerCase()];
      if (action && !current.panel) {
        event.preventDefault();
        trainer.answer(action);
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [trainer]);
  const question = state.question,
    feedback = state.feedback;
  const correct = feedback?.correct;
  const message = !feedback
    ? 'Choose the correct basic strategy action.'
    : feedback.timedOut
      ? `Time expired. Correct action: ${ACTION_LABELS[feedback.expected]}.`
      : correct
        ? `Correct! ${ACTION_LABELS[feedback.expected]}.`
        : `Incorrect. Correct action: ${ACTION_LABELS[feedback.expected]}.`;
  return (
    <>
      <GameWindow
        started={state.started}
        modalOpen={Boolean(state.panel)}
        title="BASIC STRATEGY"
        rulesSummary={`INFINITE DECK · ${settings.rules.hitSoft17 ? 'HIT' : 'STAND'} SOFT 17 · ${settings.rules.doubleAfterSplit ? 'DAS' : 'NO DAS'}${settings.rules.surrender ? ' · SURRENDER' : ''}`}
        onMenu={() => trainer.openPanel('menu')}
        onReset={() => trainer.openPanel('reset')}
        onRules={() => trainer.openPanel('rules')}
        onOptions={() => trainer.openPanel('options')}
        onHelp={() => trainer.openPanel('help')}
        footer={
          <div className="session-stats strategy-session-stats">
            CORRECT <b>{state.stats.correct}</b> / <b>{state.stats.attempts}</b>
            <span className="divider-dot">·</span> STREAK{' '}
            <b>{state.stats.streak}</b>
            <span className="divider-dot">·</span> BEST{' '}
            <b>{state.stats.bestStreak}</b>
            {state.stats.timeouts > 0 && (
              <>
                {' '}
                · TIMEOUTS <b>{state.stats.timeouts}</b>
              </>
            )}
          </div>
        }
      >
        <section className="table-shell" aria-label="Basic Strategy table">
          <div className="felt strategy-felt">
            <div className="table-topline">
              <div
                className="bank strategy-accuracy"
                aria-label="Basic Strategy accuracy"
              >
                <div className="banklabel">ACCURACY</div>
                <div className="bankvalue">
                  {state.stats.attempts
                    ? `${accuracy(state.stats).toFixed(1)}%`
                    : '—'}
                </div>
              </div>
              <div className="strategy-table-meta">
                <span>
                  HAND{' '}
                  {String(
                    state.stats.attempts + (state.phase === 'feedback' ? 0 : 1),
                  ).padStart(2, '0')}
                </span>
                {timerSeconds !== null && (
                  <span
                    className={`shoe timer-display${timerSeconds <= 5 ? ' urgent' : ''}`}
                  >
                    ⏱ {timerSeconds}s
                  </span>
                )}
              </div>
            </div>
            <div className="dealer-area">
              <div className="seat-label">Dealer upcard</div>
              <div className="cards">
                {question && (
                  <PlayingCard
                    key={question.dealer.id}
                    card={question.dealer}
                    entering
                  />
                )}
              </div>
            </div>
            <div className="center-band strategy-feedback-area">
              <div className="felt-rule">WHAT'S YOUR MOVE?</div>
              <div
                role="status"
                aria-live="polite"
                className={`status${feedback ? (correct ? ' result-positive' : ' result-negative') : ''}`}
              >
                {message}
              </div>
              <div className="strategy-explanation">
                {feedback
                  ? feedback.explanation
                  : 'Hit · Stand · Double · Split' +
                    (settings.rules.surrender ? ' · Surrender' : '')}
              </div>
            </div>
            <div className="player-area">
              <div className="hands-row">
                <div
                  className={`hand-slot strategy-hand${state.phase === 'answering' ? ' current' : ' finished'}`}
                >
                  <div className="seat-label">
                    Your hand{' '}
                    <span className="score-pill">
                      {question ? score(question.cards).total : '—'}
                    </span>
                  </div>
                  <div className="cards strategy-cards">
                    {question?.cards.map((card) => (
                      <PlayingCard key={card.id} card={card} entering />
                    ))}
                  </div>
                  <div className="hand-under">
                    {question &&
                      (score(question.cards).soft ? 'SOFT ' : 'HARD ') +
                        score(question.cards).total}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          className="action-panel strategy-action-panel"
          aria-label="Strategy actions"
        >
          <div className="panel-head">
            <span className="panel-title">Your decision</span>
            <span className="panel-helper">
              {state.phase === 'feedback'
                ? 'Next hand coming up…'
                : 'Choose the best action'}
            </span>
          </div>
          <div className="strategy-actions">
            {ACTIONS.filter(
              (action) => action !== 'surrender' || settings.rules.surrender,
            ).map((action) => (
              <ActionButton
                key={action}
                className={`${action === 'hit' ? 'safe' : ''}${feedback?.expected === action ? ' strategy-correct-action' : ''}${feedback && !correct && feedback.selected === action ? ' strategy-wrong-action' : ''}`}
                disabled={!trainer.canAnswer(action)}
                onClick={() => trainer.answer(action)}
              >
                {ACTION_LABELS[action]}
              </ActionButton>
            ))}
          </div>
          <div className="action-note">
            Shortcuts: <kbd>H</kbd> Hit · <kbd>S</kbd> Stand · <kbd>D</kbd>{' '}
            Double · <kbd>P</kbd> Split
            {settings.rules.surrender && (
              <>
                {' '}
                · <kbd>R</kbd> Surrender
              </>
            )}
          </div>
        </section>
      </GameWindow>
      <StrategyDialogs />
    </>
  );
}
