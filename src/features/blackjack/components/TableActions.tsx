import { useBlackjack } from '../hooks/useBlackjack';
import { ActionButton } from '../../../shared/ui/ActionButton';
import { money } from '../../../shared/lib/format';
export function TableActions() {
  const { game, state, roundRules } = useBlackjack();
  const betting = state.phase === 'betting' || state.phase === 'roundOver';
  const allowed = state.modeStarted && state.bankroll >= state.minBet;
  const validBet =
    state.bet >= state.minBet &&
    state.bet <= Math.min(state.maxBet, state.bankroll);
  const active = state.phase === 'playing' && !state.busy;
  const hand = state.hands[state.active];
  return (
    <section className="action-panel" aria-label="Game actions">
      <div className="action-buttons">
        {betting ? (
          <ActionButton
            className="primary wide"
            disabled={!allowed || !validBet}
            onClick={() => void game.deal()}
          >
            {state.phase === 'roundOver' ? 'Deal again  →' : 'Deal cards  →'}
          </ActionButton>
        ) : state.phase === 'insurance' ? (
          <>
            <ActionButton
              disabled={state.busy || state.bankroll < state.bet / 2}
              title={`${money(state.bet / 2)} side bet; pays 2:1`}
              onClick={() => void game.insure(true)}
            >
              Insurance
            </ActionButton>
            <ActionButton
              disabled={state.busy}
              onClick={() => void game.insure(false)}
            >
              Decline
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton
              className="safe"
              disabled={!active || !game.canHit(hand)}
              onClick={() => void game.act('hit')}
            >
              Hit
            </ActionButton>
            <ActionButton
              disabled={!active}
              onClick={() => void game.act('stand')}
            >
              Stand
            </ActionButton>
            <ActionButton
              disabled={!active || !game.canDouble(hand)}
              onClick={() => void game.act('double')}
            >
              Double
            </ActionButton>
            <ActionButton
              disabled={!active || !game.canSplit(hand)}
              onClick={() => void game.act('split')}
            >
              Split
            </ActionButton>
            {roundRules.surrender && (
              <ActionButton
                className="danger"
                disabled={!active || !game.canSurrender(hand)}
                onClick={() => void game.act('surrender')}
              >
                Surrender
              </ActionButton>
            )}
          </>
        )}
      </div>
    </section>
  );
}
