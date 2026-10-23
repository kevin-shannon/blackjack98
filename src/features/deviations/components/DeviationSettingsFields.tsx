import { Checkbox, Slider } from '../../settings/SettingsFields';
import type { DeviationOptions, DeviationRules } from '../model/types';

export function DeviationRuleFields({
  rules,
  onChange,
}: {
  rules: DeviationRules;
  onChange: <K extends keyof DeviationRules>(
    key: K,
    value: DeviationRules[K],
  ) => void;
}) {
  return (
    <fieldset className="strategy-difficulty">
      <legend>Dealer soft 17 rule</legend>
      <div className="strategy-difficulty-options">
        {(
          [
            [false, 'S17', 'Dealer stands on soft 17.'],
            [true, 'H17', 'Dealer hits soft 17.'],
          ] as const
        ).map(([value, label, description]) => (
          <label
            className="stakes-radio strategy-difficulty-choice"
            key={label}
          >
            <input
              type="radio"
              name="deviation-soft17"
              checked={rules.hitSoft17 === value}
              onChange={() => onChange('hitSoft17', value)}
            />
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function DeviationOptionFields({
  options,
  onChange,
}: {
  options: DeviationOptions;
  onChange: <K extends keyof DeviationOptions>(
    key: K,
    value: DeviationOptions[K],
  ) => void;
}) {
  return (
    <>
      <fieldset className="strategy-difficulty">
        <legend>Practice set</legend>
        <div className="deviation-set-options">
          {(
            [
              ['both', 'Both'],
              ['illustrious-18', 'Illustrious 18'],
              ['fab-4', 'Fab 4'],
            ] as const
          ).map(([value, label]) => (
            <label
              className="stakes-radio strategy-difficulty-choice"
              key={value}
            >
              <input
                type="radio"
                name="deviation-set"
                checked={options.set === value}
                onChange={() => onChange('set', value)}
              />
              <strong>{label}</strong>
            </label>
          ))}
        </div>
      </fieldset>
      <Checkbox
        label="Skip explanations"
        checked={options.skipExplanations}
        onChange={(v) => onChange('skipExplanations', v)}
        description="Move on automatically after mistakes. Turn off to review the correct move and start the next hand yourself."
      />
      <Checkbox
        label="Timed hands"
        checked={options.timedHands}
        onChange={(v) => onChange('timedHands', v)}
        description="Answer before the clock expires. Menus pause the clock; timeouts count as incorrect."
      />
      <Slider
        id="deviation-seconds"
        label="Seconds per hand"
        value={options.seconds}
        min={3}
        max={15}
        display={`${options.seconds} seconds`}
        disabled={!options.timedHands}
        onChange={(v) => onChange('seconds', v)}
      />
    </>
  );
}
