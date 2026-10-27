import { useEffect, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { useModeNavigation } from '../../app/ModeNavigation';
import { GameWindow } from '../../shared/ui/GameWindow';
import { ActionButton } from '../../shared/ui/ActionButton';
import { PlayingCard } from '../blackjack/components/PlayingCard';
import { PlayerHand } from '../blackjack/components/PlayerHand';
import { ShoeMeter } from '../blackjack/components/ShoeMeter';
import { score } from '../blackjack/model/cards';
import { countAccuracy } from './model/stats';
import { CountDialogs } from './components/CountDialogs';
import { CountCheck } from './components/CountCheck';
import { DiscardTray } from './components/DiscardTray';
import { COUNTING_TEST_LABELS } from './model/settings';
import { signedCount } from './model/questions';

export function RunningCount() {
  const { countTrainer: trainer } = useModeNavigation();
  const { state, options, shoeRemaining, shoeTotal } = useSyncExternalStore(
    trainer.subscribe,
    trainer.getSnapshot,
  );
  const playingHands = options.test === 'running-count';
  const checking = state.phase === 'question' || state.phase === 'feedback';
  const testLabel = COUNTING_TEST_LABELS[options.test];
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !state.panel) {
        event.preventDefault();
        trainer.openPanel('menu');
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [state.panel, trainer]);
  const dealerTotal = score(
    state.dealerRevealed ? state.dealer : state.dealer.slice(0, 1),
  ).total;
  return (
    <>
      <GameWindow
        started={state.started}
        modalOpen={Boolean(state.panel)}
        title="COUNTING"
        rulesSummary={
          playingHands
            ? 'RUNNING COUNT \u00b7 HI-LO \u00b7 6 DECKS'
            : options.test === 'deck-estimation'
              ? 'DECK ESTIMATION \u00b7 6-DECK SHOE'
              : 'TRUE COUNT \u00b7 MENTAL DIVISION'
        }
        onMenu={() => trainer.openPanel('menu')}
        onReset={() => trainer.openPanel('reset')}
        onRules={() => trainer.openPanel('rules')}
        onOptions={() => trainer.openPanel('options')}
        onHelp={() => trainer.openPanel('help')}
        footer={
          <div className="session-stats strategy-session-stats">
            {options.test === 'true-count' ? (
              <>
                ANSWERS <b>{state.stats.attempts}</b>
              </>
            ) : (
              <>
                CORRECT <b>{state.stats.correct}</b> /{' '}
                <b>{state.stats.attempts}</b>
              </>
            )}
            <span className="divider-dot">·</span>{' '}
            {options.test === 'true-count' ? 'EXACT STREAK' : 'STREAK'}{' '}
            <b>{state.stats.streak}</b>
            <span className="divider-dot">·</span> BEST{' '}
            <b>{state.stats.bestStreak}</b>
          </div>
        }
      >
        {playingHands ? (
          <section className="table-shell" aria-label="Running Count table">
            <div className="felt count-felt">
              <div className="table-topline">
                <div
                  className="bank strategy-accuracy"
                  aria-label="Running Count accuracy"
                >
                  <div className="banklabel">ACCURACY</div>
                  <div className="bankvalue">
                    {state.stats.attempts
                      ? `${countAccuracy(state.stats).toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
                <ShoeMeter
                  remaining={shoeRemaining}
                  total={shoeTotal}
                  penetration={75}
                />
              </div>
              <div className="dealer-area">
                <div className="seat-label" hidden={!state.dealer.length}>
                  Dealer{' '}
                  <span className="score-pill">{dealerTotal || '—'}</span>
                </div>
                <div className="cards">
                  {state.dealer.map((card, index) => (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      hidden={!state.dealerRevealed && index === 1}
                      entering={card.id === state.lastDealtId}
                    />
                  ))}
                </div>
              </div>
              <div className="center-band count-center">
                {!checking ? (
                  <>
                    <div className="felt-rule">KEEP THE COUNT</div>
                    <div className="count-play-message" role="status">
                      {state.paused ? 'Paused' : state.message}
                    </div>
                  </>
                ) : (
                  <CountCheck
                    state={state}
                    test={options.test}
                    onSubmit={trainer.submitCount}
                    onContinue={trainer.continuePractice}
                  />
                )}
              </div>
              <div className="player-area">
                <div
                  className="hands-row"
                  style={
                    {
                      '--max-card-count': Math.max(
                        1,
                        ...state.hands.map((hand) => hand.cards.length),
                      ),
                    } as CSSProperties
                  }
                >
                  {state.hands.map((hand, index) => (
                    <PlayerHand
                      key={hand.cards[0]?.id ?? index}
                      hand={hand}
                      index={index}
                      only={state.hands.length === 1}
                      active={
                        state.phase === 'playing' &&
                        index === state.activeHand &&
                        !hand.complete
                      }
                      lastDealtId={state.lastDealtId}
                      showWager={false}
                      playerName="Player"
                    />
                  ))}
                </div>
              </div>
              <div className="table-bottomline">
                <span>SHOE {String(state.shoeNumber).padStart(2, '0')}</span>
                <span aria-label="Current round">
                  ROUND {String(state.round).padStart(2, '0')}
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="table-shell" aria-label={testLabel + ' test'}>
            <div className="felt count-felt count-drill-felt">
              <div className="table-topline">
                <div
                  className="bank strategy-accuracy"
                  aria-label={testLabel + ' accuracy'}
                >
                  <div className="banklabel">ACCURACY</div>
                  <div className="bankvalue">
                    {state.stats.attempts
                      ? countAccuracy(state.stats).toFixed(1) + '%'
                      : '\u2014'}
                  </div>
                </div>
              </div>
              <div className="count-drill-layout">
                {state.question?.kind === 'deck-estimation' && (
                  <DiscardTray
                    decksRemaining={state.question.decksRemaining}
                    totalDecks={state.question.totalDecks}
                  />
                )}
                {state.question?.kind === 'true-count' && (
                  <div className="count-givens">
                    <div>
                      <span>Running count</span>
                      <output
                        className="score-pill"
                        aria-label="Given running count"
                      >
                        {signedCount(state.question.runningCount)}
                      </output>
                    </div>
                    <div>
                      <span>Decks remaining</span>
                      <output
                        className="score-pill"
                        aria-label="Given decks remaining"
                      >
                        {state.question.decksRemaining}
                      </output>
                    </div>
                  </div>
                )}
                {checking && (
                  <CountCheck
                    state={state}
                    test={options.test}
                    onSubmit={trainer.submitCount}
                    onContinue={trainer.continuePractice}
                  />
                )}
              </div>
              <div className="table-bottomline">
                <span aria-label="Current question">
                  QUESTION {String(state.round).padStart(2, '0')}
                </span>
              </div>
            </div>
          </section>
        )}
        {playingHands && (
          <div className="action-panel count-controls">
            <span>
              Count check every {options.askEvery}{' '}
              {options.askEvery === 1 ? 'round' : 'rounds'}
            </span>
            <ActionButton
              disabled={state.phase !== 'playing'}
              onClick={trainer.togglePause}
            >
              {state.paused ? 'Resume' : 'Pause'}
            </ActionButton>
          </div>
        )}
      </GameWindow>
      <CountDialogs />
    </>
  );
}
