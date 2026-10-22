import type { GameOptions, TableRules } from '../blackjack/model/types';
import { money } from '../../shared/lib/format';
import {
  BANKROLL_VALUES,
  MIN_BET_VALUES,
  MAX_BET_VALUES,
  STAKES_PRESETS,
} from './stakes';
export function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  display,
  disabled = false,
  ariaValueText,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  disabled?: boolean;
  ariaValueText?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className={`setting-slider${disabled ? ' disabled-setting' : ''}`}>
      <div className="setting-label">
        <label htmlFor={`s-${id}`}>{label}</label>
        <output htmlFor={`s-${id}`}>{display}</output>
      </div>
      <input
        id={`s-${id}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={ariaValueText}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
export function Checkbox({
  label,
  checked,
  description,
  onChange,
}: {
  label: string;
  checked: boolean;
  description: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="checkbox-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </label>
  );
}
export function RuleFields({
  rules: r,
  onChange,
}: {
  rules: TableRules;
  onChange: <K extends keyof TableRules>(key: K, value: TableRules[K]) => void;
}) {
  return (
    <>
      <Slider
        id="decks"
        label="Number of decks"
        value={r.decks}
        min={1}
        max={8}
        display={`${r.decks} ${r.decks === 1 ? 'deck' : 'decks'}`}
        onChange={(v) => onChange('decks', v)}
      />
      <Slider
        id="penetration"
        label="Shoe penetration"
        value={r.penetration}
        min={50}
        max={95}
        step={5}
        display={`${r.penetration}%`}
        onChange={(v) => onChange('penetration', v)}
      />
      <Checkbox
        label="Double after split"
        checked={r.doubleAfterSplit}
        description="Allow doubling a two-card split hand."
        onChange={(v) => onChange('doubleAfterSplit', v)}
      />
      <Checkbox
        label="Dealer hits soft 17"
        checked={r.hitSoft17}
        description="Dealer draws on a soft 17."
        onChange={(v) => onChange('hitSoft17', v)}
      />
      <Checkbox
        label="Resplit Aces"
        checked={r.resplitAces}
        description="Split another pair of Aces (up to four hands)."
        onChange={(v) => onChange('resplitAces', v)}
      />
      <Checkbox
        label="Allow surrender"
        checked={r.surrender}
        description="Late surrender: give up half the initial wager."
        onChange={(v) => onChange('surrender', v)}
      />
      <div className="setting-label select-setting">
        <label htmlFor="s-payout">Blackjack payout</label>
        <select
          id="s-payout"
          value={r.payout}
          onChange={(event) =>
            onChange('payout', event.target.value as TableRules['payout'])
          }
        >
          {(['3:2', '6:5', '1:1', '2:1'] as const).map((payout) => (
            <option key={payout} value={payout}>
              {payout}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
export function OptionFields({
  options: o,
  onChange,
}: {
  options: GameOptions;
  onChange: <K extends keyof GameOptions>(
    key: K,
    value: GameOptions[K],
  ) => void;
}) {
  return (
    <>
      <fieldset className="stakes-choices">
        <legend>Stakes</legend>
        <div className="stakes-radio-options">
          {[
            ...Object.entries(STAKES_PRESETS).map(([id, preset]) => ({
              id,
              label: preset.label,
            })),
            { id: 'custom', label: 'Custom' },
          ].map(({ id, label }) => (
            <label key={id} className="stakes-radio">
              <input
                type="radio"
                name="stakes"
                value={id}
                checked={o.stakes === id}
                onChange={() => onChange('stakes', id as GameOptions['stakes'])}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="stakes-sliders">
        {(
          [
            ['startingBankroll', 'Starting bankroll', BANKROLL_VALUES],
            ['minBet', 'Min bet', MIN_BET_VALUES],
            ['maxBet', 'Max bet', MAX_BET_VALUES],
          ] as const
        ).map(([key, label, values]) => (
          <Slider
            key={key}
            id={key}
            label={label}
            value={(values as readonly number[]).indexOf(o[key])}
            min={0}
            max={values.length - 1}
            display={money(o[key])}
            ariaValueText={money(o[key])}
            disabled={o.stakes !== 'custom'}
            onChange={(index) => onChange(key, values[index])}
          />
        ))}
      </div>
      <div className="settings-divider" />
      <Checkbox
        label="Timed hands"
        checked={o.timedHands}
        description="The countdown restarts after every action; automatically stand when it expires."
        onChange={(v) => onChange('timedHands', v)}
      />
      <Slider
        id="seconds"
        label="Seconds per action"
        value={o.seconds}
        min={3}
        max={15}
        display={`${o.seconds} seconds`}
        disabled={!o.timedHands}
        onChange={(v) => onChange('seconds', v)}
      />
    </>
  );
}
