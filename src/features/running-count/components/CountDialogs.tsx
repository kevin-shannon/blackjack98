import { useSyncExternalStore } from 'react';
import { useModeNavigation } from '../../../app/ModeNavigation';
import { ModeMenu } from '../../../app/ModeMenu';
import { Dialog } from '../../../shared/ui/Dialog';
import { ActionButton } from '../../../shared/ui/ActionButton';
import { SettingsActions } from '../../../shared/ui/SettingsActions';
import { ClassicSelect } from '../../../shared/ui/ClassicSelect';
import { Slider } from '../../settings/SettingsFields';
import { COUNTING_TEST_LABELS, paceDelay } from '../model/settings';
import type { RunningCountOptions } from '../model/settings';

function CountOptionFields({
  options,
  onChange,
}: {
  options: RunningCountOptions;
  onChange: <K extends keyof RunningCountOptions>(
    key: K,
    value: RunningCountOptions[K],
  ) => void;
}) {
  return (
    <>
      <div className="setting-label select-setting">
        <label htmlFor="count-test">Test</label>
        <ClassicSelect
          id="count-test"
          label="Test"
          value={options.test}
          options={['running-count', 'deck-estimation', 'true-count'] as const}
          getLabel={(value) => COUNTING_TEST_LABELS[value]}
          onChange={(value) => onChange('test', value)}
        />
      </div>
      {options.test === 'running-count' && (
        <>
          <Slider
            id="count-pace"
            label="Pace"
            value={options.pace}
            min={1}
            max={10}
            display={`${paceDelay(options) / 1000}s per card`}
            onChange={(value) => onChange('pace', value)}
          />
          <Slider
            id="count-frequency"
            label="Ask for count every"
            value={options.askEvery}
            min={1}
            max={10}
            display={`${options.askEvery} ${options.askEvery === 1 ? 'round' : 'rounds'}`}
            onChange={(value) => onChange('askEvery', value)}
          />
        </>
      )}
    </>
  );
}
export function CountDialogs() {
  const { countTrainer: trainer } = useModeNavigation();
  const { state, options, draft } = useSyncExternalStore(
    trainer.subscribe,
    trainer.getSnapshot,
  );
  if (state.panel === 'menu') return <ModeMenu />;
  if (state.panel === 'setup')
    return (
      <Dialog title="Blackjack 98 — Counting Setup" className="setup-modal">
        <div className="setup-topline counting-intro">
          <p>
            The whole point of counting cards is keeping track of the “True
            Count”. The True Count determines your optimal bet size and how you
            play deviations.
          </p>
          <p>
            <strong>True count = running count ÷ decks remaining.</strong>
          </p>
          <p>
            First, learn to keep the running count. Then, estimate decks
            remaining from the discard pile. Finally, practice converting the
            running count into the true count.
          </p>
        </div>
        <div className="setup-scroll">
          <fieldset className="win-group">
            <legend>Gameplay Options</legend>
            <div className="settings-form">
              <CountOptionFields
                options={draft || options}
                onChange={trainer.updateOption}
              />
            </div>
          </fieldset>
        </div>
        <div className="modal-actions setup-actions">
          <ActionButton onClick={trainer.backToMenu}>BACK</ActionButton>
          <ActionButton onClick={trainer.start}>START COUNTING</ActionButton>
        </div>
      </Dialog>
    );
  if (state.panel === 'options')
    return (
      <Dialog
        title="Blackjack 98 — Counting Options"
        className="settings-modal"
        onCancel={trainer.closePanel}
      >
        <h2>GAME OPTIONS</h2>
        <div className="settings-form">
          <CountOptionFields
            options={draft || options}
            onChange={trainer.updateOption}
          />
        </div>
        <SettingsActions
          dirty={JSON.stringify(options) !== JSON.stringify(draft)}
          onApply={trainer.applySettings}
          onClose={trainer.closePanel}
        />
      </Dialog>
    );
  if (state.panel === 'reset')
    return (
      <Dialog
        title="Blackjack 98 — New Count Session"
        className="reset-modal"
        onCancel={trainer.closePanel}
      >
        <h2>NEW SESSION?</h2>
        <p>Reset your accuracy and streaks and start this test again.</p>
        <div className="modal-actions settings-actions">
          <ActionButton onClick={trainer.start}>OK</ActionButton>
          <ActionButton onClick={trainer.closePanel}>Cancel</ActionButton>
        </div>
      </Dialog>
    );
  if (state.panel === 'rules' || state.panel === 'help')
    return (
      <Dialog
        title={
          state.panel === 'rules'
            ? 'Blackjack 98 — Count Practice Rules'
            : 'Blackjack 98 — Counting Help'
        }
        className="settings-modal help-modal"
        onCancel={trainer.closePanel}
      >
        <h2>{state.panel === 'rules' ? 'TABLE RULES' : 'HOW TO PRACTICE'}</h2>
        {state.panel === 'rules' ? (
          options.test !== 'running-count' ? (
            <ul className="rules-list">
              <li>
                Deck Estimation: estimate the used cards in the discard tray,
                then subtract from six decks to find decks remaining. Answer in
                0.5-deck steps.
              </li>
              <li>
                True Count: divide the supplied running count by the supplied
                decks remaining, then truncate toward zero by dropping the
                fractional part. For example, −5 ÷ 2 = −2.5 becomes −2.
              </li>
              <li>
                True Count accuracy gives partial credit: exact = 100%, off by 1
                = 90%, off by 2 = 80%, down to 0%. Session accuracy averages
                your answer scores. Streaks count exact answers.
              </li>
              <li>
                Each test continues indefinitely. Changing tests starts a fresh
                session.
              </li>
            </ul>
          ) : (
            <ul className="rules-list">
              <li>Six decks, shuffled at 75% penetration between rounds.</li>
              <li>
                The dealer stands on soft 17. Double after split is allowed.
              </li>
              <li>
                Up to four player hands. Split Aces receive one card; no
                resplitting Aces or surrender.
              </li>
              <li>
                The player follows basic strategy automatically. No wagers or
                insurance decisions are required.
              </li>
            </ul>
          )
        ) : (
          <ul className="rules-list">
            <li>
              Choose Running Count, Deck Estimation, or True Count in setup or
              Options. Applying a test change resets the session so accuracy
              stays specific to that test.
            </li>
            <li>
              Deck Estimation shows the discard pile. Estimate how many decks
              have been used, then subtract from the six-deck starting total.
              Answer decks remaining in half-deck steps from 0.5 to 6. Exact
              card counts and percentages are hidden.
            </li>
            <li>
              True Count gives a running count and decks remaining for mental
              division. Truncate toward zero by dropping the fractional part:
              −2.5 becomes −2 and +2.5 becomes +2.
            </li>
            <li>
              True Count accuracy averages your answer scores: exact = 100%, off
              by 1 = 90%, off by 2 = 80%, down to 0%. Streaks count exact
              answers.
            </li>
            <li>Use Hi-Lo: 2–6 = +1; 7–9 = 0; 10, J, Q, K, A = −1.</li>
            <li>
              Start each new shoe at zero. Keep the count across rounds until
              the shoe is shuffled.
            </li>
            <li>
              Count each exposed card once. Count the dealer's face-down card
              only when it is revealed.
            </li>
            <li>
              Hands play automatically. Pace controls the delay between cards
              and actions; move the slider right for faster play. The initial
              player decision always gets a two-second pause after the deal.
            </li>
            <li>
              After the selected number of completed rounds, play pauses for
              your running count. Enter a whole number, including a minus sign
              when needed.
            </li>
            <li>
              Correct answers resume play automatically. After a mistake, review
              the correct count and choose Continue.
            </li>
            <li>
              Pause and menus freeze playback. Options use OK, Cancel, and
              Apply. Starting another mode discards this session; preferences
              stay saved.
            </li>
          </ul>
        )}
        <div className="modal-actions settings-actions">
          <ActionButton onClick={trainer.closePanel}>OK</ActionButton>
        </div>
      </Dialog>
    );
  return null;
}
