import { SettingsActions } from '../../../shared/ui/SettingsActions';
import { ModeMenu } from '../../../app/ModeMenu';
import { Dialog } from '../../../shared/ui/Dialog';
import { ActionButton } from '../../../shared/ui/ActionButton';
import { useDeviationTrainer } from '../hooks/useDeviationTrainer';
import {
  DeviationOptionFields,
  DeviationRuleFields,
} from './DeviationSettingsFields';

export function DeviationDialogs() {
  const { trainer, state, settings, draft } = useDeviationTrainer();
  if (state.panel === 'menu') return <ModeMenu />;
  if (state.panel === 'setup')
    return (
      <Dialog title="Blackjack 98 — Deviations Setup" className="setup-modal">
        <div className="setup-topline">
          <div className="dialog-cap">STEP 2 OF 2 · DEVIATIONS</div>
          <h2>SET UP YOUR PRACTICE</h2>
          <p>Read the hand, upcard, and true count. Make the right call.</p>
        </div>
        <div className="setup-scroll">
          <fieldset className="win-group">
            <legend>Table Rules</legend>
            <div className="settings-form">
              <DeviationRuleFields
                rules={(draft || settings).rules}
                onChange={trainer.updateRule}
              />
            </div>
          </fieldset>
          <fieldset className="win-group">
            <legend>Gameplay Options</legend>
            <div className="settings-form">
              <DeviationOptionFields
                options={(draft || settings).options}
                onChange={trainer.updateOption}
              />
            </div>
          </fieldset>
          <div className="setting-hint">
            Hi-Lo, six-deck indices. Each hand tests the threshold or one count
            below it. Illustrious 18 uses no surrender; Fab 4 offers late
            surrender.
          </div>
        </div>
        <div className="modal-actions setup-actions">
          <ActionButton onClick={trainer.backToMenu}>BACK</ActionButton>
          <ActionButton className="primary" onClick={trainer.start}>
            START DEVIATIONS
          </ActionButton>
        </div>
      </Dialog>
    );
  if (state.panel === 'rules')
    return (
      <Dialog
        title="Blackjack 98 — Deviation Rules"
        className="settings-modal"
        onCancel={trainer.closePanel}
      >
        <h2>TABLE RULES</h2>
        <div className="setting-hint">
          Applying a dealer rule change resets this session and deals a fresh
          hand using the matching indices. Illustrious 18 drills exclude
          surrender; Fab 4 drills include late surrender.
        </div>
        <div className="settings-form">
          <DeviationRuleFields
            rules={(draft || settings).rules}
            onChange={trainer.updateRule}
          />
        </div>
        <Close />
      </Dialog>
    );
  if (state.panel === 'options')
    return (
      <Dialog
        title="Blackjack 98 — Deviation Options"
        className="settings-modal"
        onCancel={trainer.closePanel}
      >
        <h2>GAME OPTIONS</h2>
        <div className="setting-hint">
          Applying a practice set change starts a new session. Menus pause the
          decision clock and the next hand. Enable Skip explanations to move on
          automatically after mistakes instead of reviewing the correct move.
        </div>
        <div className="settings-form">
          <DeviationOptionFields
            options={(draft || settings).options}
            onChange={trainer.updateOption}
          />
        </div>
        <Close />
      </Dialog>
    );
  if (state.panel === 'reset')
    return (
      <Dialog
        title="Blackjack 98 — New Deviation Session"
        className="reset-modal"
        onCancel={trainer.closePanel}
      >
        <h2>NEW SESSION?</h2>
        <p>Reset Deviations accuracy and streaks and start a new hand.</p>
        <div className="modal-actions settings-actions">
          <ActionButton onClick={trainer.start}>OK</ActionButton>
          <ActionButton onClick={trainer.closePanel}>Cancel</ActionButton>
        </div>
      </Dialog>
    );
  if (state.panel === 'help')
    return (
      <Dialog
        title="Blackjack 98 — Deviation Help"
        className="settings-modal help-modal"
        onCancel={trainer.closePanel}
      >
        <h2>HOW TO PRACTICE</h2>
        <ul className="rules-list">
          <li>
            Practice the Hi-Lo Illustrious 18 and Fab 4 using six-deck,
            dealer-peek indices for S17 or H17.
          </li>
          <li>
            Every question uses the index or one count below it. For a +2
            threshold, expect +1 or +2. Negative thresholds work the same way.
          </li>
          <li>
            Illustrious 18 assumes no surrender. Fab 4 offers late surrender.
            The current context appears on the felt and in mistake explanations.
          </li>
          <li>
            Insurance questions ask only whether to take insurance. Use I to
            take it or N to decline it; your player hand does not affect that
            decision.
          </li>
          <li>
            Correct answers advance automatically. Mistakes and timeouts show an
            explanation and wait for Next hand. Enable Skip explanations to keep
            advancing automatically. Questions can repeat indefinitely.
          </li>
          <li>
            Accuracy, streaks, and settings are separate from Basic Strategy and
            Free Play. Changing rules or the practice set resets only this
            session.
          </li>
        </ul>
        <div className="setting-hint">
          Index references:{' '}
          <a
            href="https://wizardofodds.com/games/blackjack/card-counting/high-low/"
            target="_blank"
            rel="noreferrer"
          >
            Illustrious 18 / Fab 4
          </a>{' '}
          ·{' '}
          <a
            href="https://www.blackjacktrainer.fyi/charts/deviations/s17"
            target="_blank"
            rel="noreferrer"
          >
            H17 / S17 comparison
          </a>
        </div>
        <div className="modal-actions settings-actions">
          <ActionButton onClick={trainer.closePanel}>OK</ActionButton>
        </div>
      </Dialog>
    );
  return null;
}
function Close() {
  const { trainer, settings, draft } = useDeviationTrainer();
  return (
    <SettingsActions
      dirty={JSON.stringify(draft) !== JSON.stringify(settings)}
      onApply={trainer.applySettings}
      onClose={trainer.closePanel}
    />
  );
}
