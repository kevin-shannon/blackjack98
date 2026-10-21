import { useEffect, useState } from 'react';
import { useBlackjack } from '../hooks/useBlackjack';
import { CHIPS } from '../model/constants';
import { money } from '../../../shared/lib/format';
export function BetControls() {
  const { game, state, selectedChip } = useBlackjack();
  const [draftBet, setDraftBet] = useState(String(state.bet));
  useEffect(() => setDraftBet(String(state.bet)), [state.bet]);
  const disabled = !game.canBet() || state.bankroll < state.minBet;
  function commit() {
    game.setBet(draftBet);
    setDraftBet(String(game.getSnapshot().state.bet));
  }
  return (
    <section className="bet-panel" aria-label="Bet controls">
      <div className="panel-head">
        <span className="panel-title">Your wager</span>
        <span className="panel-helper">
          {game.canBet() ? `${money(selectedChip)} increments` : 'Wager locked'}
        </span>
      </div>
      <div className="bet-line">
        <button
          className="bet-step"
          disabled={disabled || state.bet <= state.minBet}
          aria-label={`Decrease wager by ${money(selectedChip)}`}
          onClick={() => game.setBet(state.bet - selectedChip)}
        >
          −
        </button>
        <div className="bet-value-wrap">
          <span className="money-prefix">$</span>
          <input
            className="bet-input"
            type="number"
            min={state.minBet}
            max={Math.min(state.maxBet, state.bankroll)}
            step={5}
            inputMode="numeric"
            aria-label="Bet amount"
            value={draftBet}
            disabled={disabled}
            onChange={(event) => setDraftBet(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
        </div>
        <button
          className="bet-step"
          disabled={
            disabled || state.bet >= Math.min(state.maxBet, state.bankroll)
          }
          aria-label={`Increase wager by ${money(selectedChip)}`}
          onClick={() => game.setBet(state.bet + selectedChip)}
        >
          +
        </button>
      </div>
      <div className="chips">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            className={`chip${chip === selectedChip ? ' selected' : ''}`}
            data-chip={chip}
            aria-pressed={chip === selectedChip}
            title={`Select $${chip} denomination`}
            onClick={() => game.selectChip(chip)}
          >
            ${chip}
          </button>
        ))}
      </div>
    </section>
  );
}
