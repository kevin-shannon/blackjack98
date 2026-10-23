import { useBlackjack } from '../hooks/useBlackjack';
import { CHIPS } from '../model/constants';
import { ActionButton } from '../../../shared/ui/ActionButton';
import chip5 from '../../../assets/chips/5.png';
import chip25 from '../../../assets/chips/25.png';
import chip50 from '../../../assets/chips/50.png';
import chip100 from '../../../assets/chips/100.png';
import chip500 from '../../../assets/chips/500.png';

const icons = { 5: chip5, 25: chip25, 50: chip50, 100: chip100, 500: chip500 };

export function BetControls() {
  const { game, state } = useBlackjack();
  const locked = !game.canBet();
  const limit = Math.min(state.maxBet, Math.floor(state.bankroll / 5) * 5);
  return (
    <section className="felt-wagers" aria-label="Bet controls">
      <div className="wager-chips">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            className="wager-chip"
            aria-label={'Add $' + chip + ' to bet'}
            title={'Add $' + chip + ' to bet'}
            disabled={locked || state.bet >= limit}
            onClick={() => game.addChip(chip)}
          >
            <img
              src={icons[chip]}
              width={32}
              height={32}
              alt=""
              draggable={false}
            />
          </button>
        ))}
      </div>
      <ActionButton
        className="wager-clear"
        disabled={locked || state.bet === 0}
        onClick={() => game.setBet(0)}
      >
        Clear
      </ActionButton>
    </section>
  );
}
