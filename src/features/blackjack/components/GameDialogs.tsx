import { SettingsActions } from '../../../shared/ui/SettingsActions';
import { useBlackjack } from '../hooks/useBlackjack';
import { Dialog } from '../../../shared/ui/Dialog';
import { ActionButton } from '../../../shared/ui/ActionButton';
import { RuleFields, OptionFields } from '../../settings/SettingsFields';
import { ModeMenu } from '../../../app/ModeMenu';
export function GameDialogs() {
  const { game, state, rules, options, draftRules, draftOptions } =
    useBlackjack();
  if (state.panel === 'menu') return <ModeMenu />;
  if (state.panel === 'setup')
    return (
      <Dialog
        key="setup"
        title="Blackjack 98 — Free Play Setup"
        className="setup-modal"
      >
        <div className="setup-topline">
          <div className="dialog-cap">STEP 2 OF 2 · FREE PLAY</div>
        </div>
        <div className="setup-scroll">
          <fieldset className="win-group">
            <legend>Table Rules</legend>
            <div className="settings-form">
              <RuleFields
                rules={draftRules || rules}
                onChange={game.updateRule}
              />
            </div>
          </fieldset>
          <fieldset className="win-group">
            <legend>Gameplay Options</legend>
            <div className="settings-form">
              <OptionFields
                options={draftOptions || options}
                onChange={game.updateOption}
              />
            </div>
          </fieldset>
        </div>
        <div className="modal-actions setup-actions">
          <ActionButton onClick={game.backToMenu}>BACK</ActionButton>
          <ActionButton className="primary" onClick={game.startFreePlay}>
            START FREE PLAY
          </ActionButton>
        </div>
      </Dialog>
    );
  if (state.panel === 'rules')
    return (
      <Dialog
        key="rules"
        title="Blackjack 98 — Table Rules"
        className="settings-modal"
        onCancel={game.closePanel}
      >
        <h2>TABLE RULES</h2>
        <div className="setting-hint">
          Applying rule changes cancels any round in progress and refund all
          wagers. A fresh shoe starts with the updated rules.
        </div>
        <div className="settings-form">
          <RuleFields rules={draftRules || rules} onChange={game.updateRule} />
        </div>
        <Close />
      </Dialog>
    );
  if (state.panel === 'options')
    return (
      <Dialog
        key="options"
        title="Blackjack 98 — Game Options"
        className="settings-modal"
        onCancel={game.closePanel}
      >
        <h2>GAME OPTIONS</h2>
        <div className="setting-hint">
          Stakes, starting bankroll, and bet limits apply to the next new
          session. Timed hands pause while menus are open. The count uses
          exposed cards since the last shuffle.
        </div>
        <div className="settings-form">
          <OptionFields
            options={draftOptions || options}
            onChange={game.updateOption}
          />
        </div>
        <Close />
      </Dialog>
    );
  if (state.panel === 'reset')
    return (
      <Dialog key="reset" title="Blackjack 98 — New Session">
        <h2>NEW SESSION?</h2>
        <p>
          Reset your bankroll, hands, running count, and win/loss record. Table
          rules and gameplay options stay saved.
        </p>
        <div className="modal-actions">
          <ActionButton onClick={game.closePanel}>CANCEL</ActionButton>
          <ActionButton className="primary" onClick={game.resetSession}>
            RESET
          </ActionButton>
        </div>
      </Dialog>
    );
  if (state.panel === 'help')
    return (
      <Dialog
        key="help"
        title="Blackjack 98 — Help"
        className="settings-modal"
        onCancel={game.closePanel}
      >
        <h2>HOW TO PLAY</h2>
        <ul className="rules-list">
          <li>Get closer to 21 than the dealer without busting.</li>
          <li>Aces count as 1 or 11; face cards count as 10.</li>
          <li>
            Natural blackjack pays <b>{rules.payout}</b>.
          </li>
          <li>
            <b>Double:</b> match your wager, then draw one card only.
          </li>
          <li>
            <b>Split:</b> play two same-value starting cards as separate hands.
          </li>
          <li>
            <b>Split Aces:</b> one card per Ace, with no additional hits or
            doubles. Resplit Aces (RSA) allows another A,A split, up to four
            hands.
          </li>
          <li>
            <b>Insurance:</b> when the dealer shows an Ace, wager half of the
            original bet. Pays 2:1 if dealer has blackjack.
          </li>
          <li>
            <b>Late surrender:</b> when enabled, give up half the wager before
            acting.
          </li>
          <li>
            <b>Hi-Lo:</b> 2–6 = +1, 7–9 = 0, 10–Ace = −1. Count resets on
            shuffle.
          </li>
        </ul>
        <div className="modal-actions">
          <ActionButton className="primary wide" onClick={game.closePanel}>
            OK
          </ActionButton>
        </div>
      </Dialog>
    );
  return null;
}
function Close() {
  const { game, rules, options, draftRules, draftOptions } = useBlackjack();
  return (
    <SettingsActions
      dirty={
        JSON.stringify(draftRules) !== JSON.stringify(rules) ||
        JSON.stringify(draftOptions) !== JSON.stringify(options)
      }
      onApply={game.applySettings}
      onClose={game.closePanel}
    />
  );
}
