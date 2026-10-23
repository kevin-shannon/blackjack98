import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { GameWindow } from '../../../shared/ui/GameWindow';
import { ActionButton } from '../../../shared/ui/ActionButton';
import { RoundCounter } from '../../../shared/ui/RoundCounter';
import { PlayingCard } from '../../blackjack/components/PlayingCard';
import { score } from '../../blackjack/model/cards';
import type { Card } from '../../blackjack/model/types';
import { accuracy } from '../../stats/sessionStats';
import type { PracticePanel, PracticeState } from '../model/types';

export interface PracticeAction<Action extends string> {
  action: Action;
  label: string;
  key: string;
}
export function DecisionPractice<
  Question extends { cards: [Card, Card]; dealer: Card },
  Action extends string,
  Mode extends string,
>({
  trainer,
  state,
  timerSeconds,
  title,
  name,
  rulesSummary,
  actions,
  prompt,
  questionTitle = "WHAT'S YOUR MOVE?",
  extraMeta,
  context,
}: {
  trainer: {
    getSnapshot(): { state: PracticeState<Question, Action, Mode> };
    answer(action: Action): void;
    nextHand(): void;
    canAnswer(action: Action): boolean;
    openPanel(panel: Exclude<PracticePanel, null>): void;
    closePanel(): void;
    backToMenu(): void;
  };
  state: PracticeState<Question, Action, Mode>;
  timerSeconds: number | null;
  title: string;
  name: string;
  rulesSummary: string;
  actions: readonly PracticeAction<Action>[];
  prompt: string;
  questionTitle?: string;
  extraMeta?: ReactNode;
  context?: ReactNode;
}) {
  const explanationId = useId();
  const reviewing = state.phase === 'review';
  const nextHandRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (reviewing && !state.panel) nextHandRef.current?.focus();
  }, [reviewing, state.panel]);
  const actionLabel = (action: Action) =>
    actions.find((entry) => entry.action === action)?.label ?? action;
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
      const action = actions.find(
        (entry) => entry.key.toLowerCase() === event.key.toLowerCase(),
      )?.action;
      if (action && !current.panel) {
        event.preventDefault();
        trainer.answer(action);
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [trainer, actions]);
  const question = state.question,
    feedback = state.feedback;
  const correct = feedback?.correct;
  const message = !feedback
    ? prompt
    : feedback.timedOut
      ? `Time expired. Correct action: ${actionLabel(feedback.expected)}.`
      : correct
        ? `Correct! ${actionLabel(feedback.expected)}.`
        : `Incorrect. Correct action: ${actionLabel(feedback.expected)}.`;
  return (
    <>
      <GameWindow
        started={state.started}
        modalOpen={Boolean(state.panel)}
        title={title}
        rulesSummary={rulesSummary}
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
        <div className={`practice-layout${reviewing ? ' has-review' : ''}`}>
          <section className="table-shell" aria-label={`${name} table`}>
            <div className="felt strategy-felt">
              <div className="table-topline">
                <div
                  className="bank strategy-accuracy"
                  aria-label={`${name} accuracy`}
                >
                  <div className="banklabel">ACCURACY</div>
                  <div className="bankvalue">
                    {state.stats.attempts
                      ? `${accuracy(state.stats).toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
                <div className="strategy-table-meta">
                  {extraMeta}
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
                <div className="seat-label">
                  Dealer{' '}
                  <span className="score-pill">
                    {question ? score([question.dealer]).total : '—'}
                  </span>
                </div>
                <div className="cards">
                  {question && (
                    <>
                      <PlayingCard
                        key={question.dealer.id}
                        card={question.dealer}
                        entering
                      />
                      {/* A decorative hole card: always hidden and excluded from scoring. */}
                      <PlayingCard
                        key={`hole-${question.dealer.id}`}
                        card={question.dealer}
                        hidden
                        entering
                      />
                    </>
                  )}
                </div>
              </div>
              <div
                className={`center-band strategy-feedback-area${reviewing ? ' is-reviewing' : ''}`}
              >
                {!reviewing && (
                  <>
                    <div className="felt-rule">{questionTitle}</div>
                    {context}
                  </>
                )}
                <div className="visually-hidden" aria-live="polite">
                  {message}
                </div>
                {reviewing && state.feedback && (
                  <aside
                    className="practice-review"
                    role="region"
                    aria-label="Explanation"
                  >
                    <div className="practice-review-title">
                      {state.feedback.timedOut
                        ? 'Time expired'
                        : 'Correct move'}
                    </div>
                    <h2>{actionLabel(state.feedback.expected)}</h2>
                    {context}
                    <p id={explanationId}>{state.feedback.explanation}</p>
                    <ActionButton
                      ref={nextHandRef}
                      className="primary wide"
                      onClick={trainer.nextHand}
                      aria-describedby={explanationId}
                      autoFocus
                    >
                      Next hand
                    </ActionButton>
                  </aside>
                )}
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
                  </div>
                </div>
              </div>
              <div className="table-bottomline">
                <RoundCounter
                  round={
                    state.stats.attempts +
                    (state.phase === 'answering' || state.phase === 'idle'
                      ? 1
                      : 0)
                  }
                />
              </div>
            </div>
          </section>
        </div>
        <section
          className="action-panel strategy-action-panel"
          aria-label="Strategy actions"
        >
          <div className="strategy-actions">
            {actions.map(({ action, label }) => (
              <ActionButton
                key={action}
                className={`${action === 'hit' ? 'safe' : ''}${feedback?.expected === action ? ' strategy-correct-action' : ''}${feedback && !correct && feedback.selected === action ? ' strategy-wrong-action' : ''}`}
                disabled={!trainer.canAnswer(action)}
                onClick={() => trainer.answer(action)}
              >
                {label}
              </ActionButton>
            ))}
          </div>
        </section>
      </GameWindow>
    </>
  );
}
