import { Dialog } from '../shared/ui/Dialog';
import { ActionButton } from '../shared/ui/ActionButton';
import { trainingModes } from './trainingModes';
import { useModeNavigation } from './ModeNavigation';

export function ModeMenu() {
  const { activeMode, selectMode, resumeMode, canResume } = useModeNavigation();
  return (
    <Dialog title="Blackjack 98 — Main Menu" className="menu-modal">
      <div className="dialog-cap">BLACKJACK 98</div>
      <h2>MAIN MENU</h2>
      <div className="menu-section-title">SELECT GAME MODE</div>
      {trainingModes.map((mode) => (
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
          <span className="mode-arrow">▶</span>
        </button>
      ))}
      <div className="future-mode">▦ &nbsp; More game modes coming later</div>
      <div className="menu-utilities">
        {trainingModes
          .filter((mode) => canResume(mode.id))
          .map((mode) => (
            <ActionButton
              key={mode.id}
              className={mode.id === activeMode ? 'primary wide' : 'wide'}
              onClick={() => resumeMode(mode.id)}
            >
              {mode.id === activeMode ? 'RESUME GAME' : `RESUME ${mode.title}`}
            </ActionButton>
          ))}
      </div>
    </Dialog>
  );
}
