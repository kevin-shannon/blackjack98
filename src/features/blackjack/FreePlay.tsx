import { useLayoutEffect } from 'react';
import { APP_ICON } from '../../assets/brand';
import { useBlackjack } from './hooks/useBlackjack';
import { useGameKeyboard } from './hooks/useGameKeyboard';
import { money } from '../../shared/lib/format';
import { BlackjackTable } from './components/BlackjackTable';
import { BetControls } from './components/BetControls';
import { TableActions } from './components/TableActions';
import { GameDialogs } from './components/GameDialogs';
export function FreePlay() {
  const { game, state, rules } = useBlackjack();
  const modalOpen = Boolean(state.panel || state.phase === 'insurance');
  useGameKeyboard();
  useLayoutEffect(() => {
    document.body.classList.toggle('pre-session', !state.modeStarted);
    document.body.classList.toggle('modal-open', modalOpen);
    return () => document.body.classList.remove('pre-session', 'modal-open');
  }, [state.modeStarted, modalOpen]);
  return (
    <>
      <div className="app" inert={modalOpen}>
        <header className="topbar">
          <div className="brand">
            <img
              className="app-icon"
              aria-hidden="true"
              src={APP_ICON}
              width={32}
              height={32}
              alt=""
            />
            <div>
              <div className="brandname">Blackjack 98</div>
            </div>
          </div>
        </header>
        <nav className="menubar" aria-label="Game menu">
          <button
            className="menu-item"
            type="button"
            onClick={() => game.openPanel('menu')}
          >
            <u>G</u>ame Menu
          </button>
          <button
            className="menu-item"
            type="button"
            disabled={!state.modeStarted}
            onClick={() => game.openPanel('reset')}
          >
            New Session
          </button>
          <span className="menu-sep" />
          <button
            className="menu-item"
            type="button"
            onClick={() => game.openPanel('rules')}
          >
            Table <u>R</u>ules
          </button>
          <button
            className="menu-item"
            type="button"
            onClick={() => game.openPanel('options')}
          >
            <u>O</u>ptions
          </button>
          <span className="menu-sep" />
          <button
            className="menu-item"
            type="button"
            onClick={() => game.openPanel('help')}
          >
            <u>H</u>elp
          </button>
        </nav>
        <div className="heading-line">
          <div>
            <div className="eyebrow mode-label">
              {state.modeStarted ? 'NOW PLAYING' : 'SELECT A GAME MODE'}
            </div>
            <h1>{state.modeStarted ? 'FREE PLAY' : 'BLACKJACK!'}</h1>
          </div>
          <div className="rules">{`${rules.decks} ${rules.decks === 1 ? 'DECK' : 'DECKS'} · ${rules.hitSoft17 ? 'HIT' : 'STAND'} SOFT 17 · ${rules.payout} PAYOUT`}</div>
        </div>
        <main>
          <BlackjackTable />
          <div className="control-panel">
            <BetControls />
            <TableActions />
          </div>
        </main>
        <div className="bottom-meta">
          <div className="session-stats">
            SESSION{' '}
            <b>{(state.sessionNet > 0 ? '+' : '') + money(state.sessionNet)}</b>
            <span className="divider-dot">·</span>W <b>{state.wins}</b> / L{' '}
            <b>{state.losses}</b> / P <b>{state.pushes}</b>
          </div>
        </div>
      </div>
      <GameDialogs />
    </>
  );
}
