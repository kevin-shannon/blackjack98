import { Dialog } from '../shared/ui/Dialog';
import { ActionButton } from '../shared/ui/ActionButton';
import { trainingModes } from './trainingModes';
import { useModeNavigation } from './ModeNavigation';
import playIcon from '../assets/play.png';
import smileyIcon from '../assets/smiley.png';

export function ModeMenu() {
  const { selectMode, resumeGame, canResume } = useModeNavigation();
  return (
    <Dialog
      title="Blackjack 98 — Main Menu"
      className="menu-modal"
      initialFocus="dialog"
    >
      <div className="menu-welcome">
        <h2>Welcome to Blackjack 98!</h2>
        <p>
          I built this trainer to help you learn the skills needed to become a
          pro card counter. I hope you enjoy it.{' '}
          <img
            src={smileyIcon}
            width={16}
            height={16}
            alt=""
            aria-hidden="true"
          />
        </p>
      </div>
      {(['train', 'play'] as const).map((category) => (
        <section
          className="mode-group"
          key={category}
          aria-labelledby={`mode-group-${category}`}
        >
          <h3 className="mode-group-title" id={`mode-group-${category}`}>
            {category === 'train' ? 'Train' : 'Play'}
          </h3>
          {trainingModes
            .filter((mode) => mode.category === category)
            .map((mode) => (
              <button
                type="button"
                key={mode.id}
                className="mode-tile"
                onClick={() => selectMode(mode.id)}
              >
                <span>
                  <strong>{mode.title}</strong>
                  <small>{mode.description}</small>
                </span>
                <img
                  className="mode-arrow"
                  src={playIcon}
                  width={16}
                  height={16}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            ))}
        </section>
      ))}
      <div className="menu-utilities">
        {canResume() && (
          <ActionButton className="primary wide" onClick={resumeGame}>
            RESUME GAME
          </ActionButton>
        )}
      </div>
    </Dialog>
  );
}
