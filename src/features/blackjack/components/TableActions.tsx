import { useBlackjack } from '../hooks/useBlackjack';
import { ActionButton } from '../../../shared/ui/ActionButton';
export function TableActions() {
  const { game, state, roundRules } = useBlackjack();
  const betting = state.phase === 'betting' || state.phase === 'roundOver';
  const allowed = state.modeStarted && state.bankroll >= state.minBet;
  const active = state.phase === 'playing' && !state.busy;
  const hand = state.hands[state.active];
  const hint = betting
    ? !state.modeStarted
      ? 'Select a mode'
      : !allowed
        ? 'Below table minimum'
        : state.phase === 'roundOver'
          ? 'Next round'
          : 'Ready when you are'
    : state.phase === 'insurance'
      ? 'Insurance decision'
      : state.phase === 'dealerTurn'
        ? 'Dealer playing'
        : state.phase === 'dealing'
          ? 'Dealing cards'
          : `Hand ${state.active + 1} of ${state.hands.length}`;
  return (
    <section className="action-panel" aria-label="Game actions">
      <div className="panel-head">
        <span className="panel-title">Table actions</span>
        <span className="panel-helper">{hint}</span>
      </div>
      <div className="action-buttons">
        {betting ? (
          <ActionButton
            className="primary wide"
            disabled={!allowed}
            onClick={() => void game.deal()}
          >
            {state.phase === 'roundOver' ? 'DEAL AGAIN  →' : 'DEAL CARDS  →'}
          </ActionButton>
        ) : (
          <>
            <ActionButton
              className="safe"
              disabled={!active || !game.canHit(hand)}
              onClick={() => void game.act('hit')}
            >
              HIT
            </ActionButton>
            <ActionButton
              disabled={!active}
              onClick={() => void game.act('stand')}
            >
              STAND
            </ActionButton>
            <ActionButton
              disabled={!active || !game.canDouble(hand)}
              onClick={() => void game.act('double')}
            >
              DOUBLE
            </ActionButton>
            <ActionButton
              disabled={!active || !game.canSplit(hand)}
              onClick={() => void game.act('split')}
            >
              SPLIT
            </ActionButton>
            {roundRules.surrender && (
              <ActionButton
                className="danger wide"
                disabled={!active || !game.canSurrender(hand)}
                onClick={() => void game.act('surrender')}
              >
                SURRENDER
              </ActionButton>
            )}
          </>
        )}
      </div>
      <div className="action-note">
        {betting ? (
          !allowed ? (
            'Select Free Play or start a new session'
          ) : (
            ''
          )
        ) : state.phase === 'playing' ? (
          <>
            Shortcuts: <kbd>H</kbd> Hit · <kbd>S</kbd> Stand · <kbd>D</kbd>{' '}
            Double · <kbd>P</kbd> Split
            {roundRules.surrender && (
              <>
                {' '}
                · <kbd>R</kbd> Surrender
              </>
            )}
          </>
        ) : (
          ''
        )}
      </div>
    </section>
  );
}
