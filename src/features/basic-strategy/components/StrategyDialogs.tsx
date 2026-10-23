import { ModeMenu } from '../../../app/ModeMenu';
import { Dialog } from '../../../shared/ui/Dialog';
import { ActionButton } from '../../../shared/ui/ActionButton';
import { useStrategyTrainer } from '../hooks/useStrategyTrainer';
import {
  StrategyOptionFields,
  StrategyRuleFields,
} from './StrategySettingsFields';

export function StrategyDialogs() {
  const { trainer, state, settings, draft } = useStrategyTrainer();
  if (state.panel === 'menu') return <ModeMenu />;
  if (state.panel === 'setup')
    return (
      <Dialog
        key="strategy-setup"
        title="Blackjack 98 — Basic Strategy Setup"
        className="setup-modal"
      >
        <div className="setup-topline">
          <div className="dialog-cap">STEP 2 OF 2 · BASIC STRATEGY</div>
          <h2>SET UP YOUR PRACTICE</h2>
          <p>One decision per hand. Get instant feedback and keep going.</p>
        </div>
        <div className="setup-scroll">
          <fieldset className="win-group">
            <legend>Table Rules</legend>
            <div className="settings-form">
              <StrategyRuleFields
                rules={(draft || settings).rules}
                onChange={trainer.updateRule}
              />
            </div>
          </fieldset>
          <fieldset className="win-group">
            <legend>Gameplay Options</legend>
            <div className="settings-form">
              <StrategyOptionFields
                options={(draft || settings).options}
                onChange={trainer.updateOption}
              />
            </div>
          </fieldset>
          <div className="setting-hint">
            Normal deals random hands. Difficult picks from the edge cases for
            your table rules. Both continue indefinitely; accuracy is separate
            from Free Play.
          </div>
        </div>
        <div className="modal-actions setup-actions">
          <ActionButton onClick={trainer.backToMenu}>◀ BACK</ActionButton>
          <ActionButton className="primary" onClick={trainer.start}>
            START BASIC STRATEGY ▶
          </ActionButton>
        </div>
      </Dialog>
    );
  if (state.panel === 'rules')
    return (
      <Dialog
        key="strategy-rules"
        title="Blackjack 98 — Basic Strategy Rules"
        className="settings-modal"
      >
        <h2>TABLE RULES</h2>
        <div className="setting-hint">
          Practice uses standard multi-deck basic strategy with dealer peek and
          doubling on any two starting cards. Changing a table rule starts a new
          session, resetting accuracy, streaks, and all practice counters.
        </div>
        <div className="settings-form">
          <StrategyRuleFields
            rules={settings.rules}
            onChange={trainer.updateRule}
          />
        </div>
        <Close />
      </Dialog>
    );
  if (state.panel === 'options')
    return (
      <Dialog
        key="strategy-options"
        title="Blackjack 98 — Basic Strategy Options"
        className="settings-modal"
      >
        <h2>GAME OPTIONS</h2>
        <div className="setting-hint">
          Correct answers advance automatically. After a mistake or timeout,
          review the explanation and choose Next hand. Enable Skip explanations
          to advance automatically after every answer. Changing difficulty keeps
          your accuracy.
        </div>
        <div className="settings-form">
          <StrategyOptionFields
            options={settings.options}
            onChange={trainer.updateOption}
          />
        </div>
        <Close />
      </Dialog>
    );
  if (state.panel === 'reset')
    return (
      <Dialog key="strategy-reset" title="Blackjack 98 — New Strategy Session">
        <h2>NEW SESSION?</h2>
        <p>Reset Basic Strategy accuracy and streaks and start a new hand.</p>
        <div className="modal-actions">
          <ActionButton onClick={trainer.closePanel}>CANCEL</ActionButton>
          <ActionButton className="primary" onClick={trainer.start}>
            RESET
          </ActionButton>
        </div>
      </Dialog>
    );
  if (state.panel === 'help')
    return (
      <Dialog
        key="strategy-help"
        title="Blackjack 98 — Basic Strategy Help"
        className="settings-modal"
      >
        <h2>HOW TO PRACTICE</h2>
        <ul className="rules-list">
          <li>
            Choose the best initial action for your two cards against the
            dealer's upcard.
          </li>
          <li>
            The decision is graded immediately. Correct answers advance
            automatically. Mistakes and timeouts show an explanation and wait
            for Next hand, unless Skip explanations is enabled.
          </li>
          <li>
            Normal draws cards with replacement: every card remains equally
            likely, including repeated identical cards. Natural blackjacks are
            skipped because there is no decision.
          </li>
          <li>
            Difficult randomly picks hand/upcard combinations where a
            neighboring total or upcard changes the correct action. Pairs
            compare only dealer upcards. The pool follows your table rules, with
            repeats allowed.
          </li>
          <li>
            DAS, H17, and late surrender change the strategy. No wagers,
            bankroll, shoe depletion, or running count are used.
          </li>
          <li>
            Accuracy is correct answers divided by all answered hands, including
            timeouts. New Session resets only this mode's stats.
          </li>
          <li>
            Shortcuts: H = Hit, S = Stand, D = Double, P = Split, R = Surrender.
            Escape opens the menu.
          </li>
        </ul>
        <div className="modal-actions">
          <ActionButton className="primary wide" onClick={trainer.closePanel}>
            OK
          </ActionButton>
        </div>
      </Dialog>
    );
  return null;
}
function Close() {
  const { trainer } = useStrategyTrainer();
  return (
    <div className="modal-actions bottom-actions">
      <ActionButton className="primary wide" onClick={trainer.closePanel}>
        CLOSE
      </ActionButton>
    </div>
  );
}
