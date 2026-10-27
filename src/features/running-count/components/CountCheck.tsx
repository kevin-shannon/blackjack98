import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '../../../shared/ui/ActionButton';
import smiley from '../../../assets/smiley.png';
import type { RunningCountState } from '../model/createRunningCountTrainer';
import { COUNTING_TEST_LABELS } from '../model/settings';
import type { CountingTest } from '../model/settings';
import { signedCount, validCountAnswer } from '../model/questions';

export function CountCheck({
  state,
  test,
  onSubmit,
  onContinue,
}: {
  state: RunningCountState;
  test: CountingTest;
  onSubmit: (answer: number) => void;
  onContinue: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (state.phase === 'question') setAnswer('');
  }, [state.phase, state.round]);
  useEffect(() => {
    if (state.panel) return;
    if (state.phase === 'question') input.current?.focus();
    else if (state.phase === 'feedback' && !state.feedback?.correct)
      continueButton.current?.focus();
  }, [state.phase, state.panel, state.feedback?.correct]);
  const decks = test === 'deck-estimation';
  const numeric = decks
    ? /^\+?(?:\d+(?:\.\d+)?|\.\d+)$/.test(answer.trim())
    : /^[+-]?\d+$/.test(answer.trim());
  const valid = numeric && validCountAnswer(test, Number(answer));
  const format = (count: number) =>
    decks ? String(count) : signedCount(count);
  const prompt = decks
    ? 'How many decks remain?'
    : test === 'true-count'
      ? 'What is the true count?'
      : 'What is the running count?';
  const inputLabel = decks
    ? 'Your deck estimate'
    : test === 'true-count'
      ? 'Your true count'
      : 'Your running count';
  const caption = decks
    ? 'Decks remaining'
    : test === 'true-count'
      ? 'True count'
      : 'Running count';
  return (
    <aside
      className={`practice-review count-check${test !== 'running-count' ? ' count-drill-check' : ''}`}
      aria-label="Count check"
      role="region"
    >
      <div className="practice-review-title">{COUNTING_TEST_LABELS[test]}</div>
      {state.phase === 'question' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) onSubmit(Number(answer));
          }}
        >
          <label htmlFor="count-answer">{prompt}</label>
          {decks && (
            <p className="count-answer-hint">
              Estimate the discards, then subtract from 6. Answer in 0.5-deck
              steps.
            </p>
          )}
          {test === 'true-count' && (
            <p className="count-answer-hint">
              Truncate toward zero (−2.5 → −2).
            </p>
          )}
          <div className="count-answer-row">
            <input
              ref={input}
              id="count-answer"
              type="text"
              inputMode={decks ? 'decimal' : 'text'}
              autoComplete="off"
              spellCheck={false}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              aria-label={inputLabel}
            />
            <div className="practice-review-actions">
              <ActionButton type="submit" disabled={!valid}>
                Submit
              </ActionButton>
            </div>
          </div>
        </form>
      ) : (
        state.feedback && (
          <>
            <h2 className="count-answer-result">
              {state.feedback.correct ? (
                <>
                  CORRECT <img src={smiley} width={24} height={24} alt="" />
                </>
              ) : test === 'true-count' ? (
                Math.abs(state.feedback.answer - state.feedback.expected) <=
                2 ? (
                  'Close, but not quite.'
                ) : (
                  'Not quite.'
                )
              ) : (
                'Incorrect'
              )}
            </h2>
            <p role="status">
              {caption}: <b>{format(state.feedback.expected)}</b>
              {!state.feedback.correct && (
                <>. Your answer: {format(state.feedback.answer)}.</>
              )}
            </p>
            {state.question?.kind === 'deck-estimation' && (
              <p>
                {state.question.totalDecks} decks −{' '}
                {state.question.totalDecks - state.question.decksRemaining}{' '}
                discarded = {state.question.decksRemaining} remaining.
              </p>
            )}
            {state.question?.kind === 'true-count' && (
              <p>
                {signedCount(state.question.runningCount)} ÷{' '}
                {state.question.decksRemaining} ={' '}
                {(
                  state.question.runningCount / state.question.decksRemaining
                ).toFixed(2)}
                . Truncate toward zero: {signedCount(state.question.expected)}.
              </p>
            )}
            {!state.feedback.correct && (
              <div className="practice-review-actions">
                <ActionButton ref={continueButton} onClick={onContinue}>
                  Continue
                </ActionButton>
              </div>
            )}
          </>
        )
      )}
    </aside>
  );
}
