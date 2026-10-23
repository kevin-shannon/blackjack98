import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { APP_ICON } from '../../assets/brand';

export function GameWindow({
  started,
  modalOpen,
  title,
  rulesSummary,
  children,
  footer,
  onMenu,
  onReset,
  onRules,
  onOptions,
  onHelp,
}: {
  started: boolean;
  modalOpen: boolean;
  title: string;
  rulesSummary: string;
  children: ReactNode;
  footer: ReactNode;
  onMenu: () => void;
  onReset: () => void;
  onRules: () => void;
  onOptions: () => void;
  onHelp: () => void;
}) {
  useLayoutEffect(() => {
    document.body.classList.toggle('pre-session', !started);
    document.body.classList.toggle('modal-open', modalOpen);
    return () => document.body.classList.remove('pre-session', 'modal-open');
  }, [started, modalOpen]);
  return (
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
        <button className="menu-item" type="button" onClick={onMenu}>
          <u>G</u>ame Menu
        </button>
        <button
          className="menu-item"
          type="button"
          disabled={!started}
          onClick={onReset}
        >
          New Session
        </button>
        <span className="menu-sep" />
        <button className="menu-item" type="button" onClick={onRules}>
          Table <u>R</u>ules
        </button>
        <button className="menu-item" type="button" onClick={onOptions}>
          <u>O</u>ptions
        </button>
        <span className="menu-sep" />
        <button className="menu-item" type="button" onClick={onHelp}>
          <u>H</u>elp
        </button>
      </nav>
      <div className="heading-line">
        <div>
          {!started && (
            <div className="eyebrow mode-label">SELECT A GAME MODE</div>
          )}
          <h1>{started ? title : 'BLACKJACK!'}</h1>
        </div>
        <div className="rules">{rulesSummary}</div>
      </div>
      <main>{children}</main>
      <div className="bottom-meta">{footer}</div>
    </div>
  );
}
