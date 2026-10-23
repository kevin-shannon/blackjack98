import { useBlackjack } from '../hooks/useBlackjack';
import type { CSSProperties } from 'react';
import { money } from '../../../shared/lib/format';
import { score } from '../model/cards';
import { PlayingCard } from './PlayingCard';
import { PlayerHand } from './PlayerHand';
import { ShoeMeter } from './ShoeMeter';
import { CountPeek } from './CountPeek';
import { RoundCounter } from '../../../shared/ui/RoundCounter';
export function BlackjackTable() {
  const { state, rules, shoeRemaining, shoeTotal, timerSeconds } =
    useBlackjack();
  const known = state.dealerRevealed
    ? score(state.dealer).total
    : state.dealer.length
      ? score(state.dealer.slice(0, 1)).total
      : '—';
  const resultClass =
    state.phase === 'roundOver'
      ? state.netResult > 0
        ? ' result-positive'
        : state.netResult < 0
          ? ' result-negative'
          : ''
      : '';
  return (
    <section className="table-shell" aria-label="Blackjack table">
      <div className="felt">
        <div className="table-topline">
          <div className="bank" aria-label="Current bankroll">
            <div className="banklabel">BANKROLL</div>
            <div className="bankvalue">{money(state.bankroll)}</div>
          </div>
          <div className="table-tools">
            <div className="shoe-group">
              {timerSeconds !== null && (
                <span
                  className={`shoe timer-display${timerSeconds <= 5 ? ' urgent' : ''}`}
                >
                  ⏱ {timerSeconds}s
                </span>
              )}
              <ShoeMeter
                remaining={shoeRemaining}
                total={shoeTotal}
                penetration={rules.penetration}
              />
            </div>
            <CountPeek
              count={state.runningCount}
              enabled={
                state.modeStarted && !state.panel && state.phase !== 'insurance'
              }
            />
          </div>
        </div>
        <div className="dealer-area">
          <div className="seat-label" hidden={state.hands.length === 0}>
            Dealer <span className="score-pill">{known}</span>
          </div>
          <div className="cards">
            {state.dealer.map((card, i) => (
              <PlayingCard
                key={card.id}
                card={card}
                hidden={!state.dealerRevealed && i === 1}
                entering={card.id === state.lastDealtId}
              />
            ))}
          </div>
        </div>
        <div className="center-band">
          <div className="felt-rule">
            <div>{`BLACKJACK PAYS ${rules.payout}`}</div>
            <div className="insurance-rule">INSURANCE PAYS 2:1</div>
          </div>
          <div
            className={`status${resultClass}`}
            role="status"
            aria-live="polite"
          >
            {state.message}
          </div>
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
                key={hand.cards[0]?.id ?? `empty-${index}`}
                hand={hand}
                index={index}
                only={state.hands.length === 1}
                active={
                  state.phase === 'playing' &&
                  index === state.active &&
                  !hand.complete
                }
                lastDealtId={state.lastDealtId}
              />
            ))}
          </div>
        </div>
        <div className="table-bottomline">
          <span>
            {`MIN ${money(state.minBet)} `}
            <span style={{ padding: '0 7px' }}>•</span>
            {` MAX ${money(state.maxBet)}`}
          </span>
          <RoundCounter round={state.round} />
        </div>
      </div>
    </section>
  );
}
