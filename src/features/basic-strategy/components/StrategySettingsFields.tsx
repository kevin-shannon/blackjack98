import { Checkbox, Slider } from '../../settings/SettingsFields';
import type { StrategyOptions, StrategyRules } from '../model/types';

export function StrategyRuleFields({
  rules,
  onChange,
}: {
  rules: StrategyRules;
  onChange: <K extends keyof StrategyRules>(
    key: K,
    value: StrategyRules[K],
  ) => void;
}) {
  return (
    <>
      <Checkbox
        label="Double after split (DAS)"
        checked={rules.doubleAfterSplit}
        onChange={(v) => onChange('doubleAfterSplit', v)}
        description="Use basic strategy for tables that allow doubling after a split."
      />
      <Checkbox
        label="Dealer hits soft 17 (H17)"
        checked={rules.hitSoft17}
        onChange={(v) => onChange('hitSoft17', v)}
        description="Adjust the correct action for H17 rules."
      />
      <Checkbox
        label="Late surrender (LS)"
        checked={rules.surrender}
        onChange={(v) => onChange('surrender', v)}
        description="Include late surrender among the available actions."
      />
    </>
  );
}
export function StrategyOptionFields({
  options,
  onChange,
}: {
  options: StrategyOptions;
  onChange: <K extends keyof StrategyOptions>(
    key: K,
    value: StrategyOptions[K],
  ) => void;
}) {
  return (
    <>
      <fieldset className="strategy-difficulty">
        <legend>Difficulty</legend>
        <div className="strategy-difficulty-options">
          {(
            [
              ['normal', 'Normal', 'Random hands from an infinite deck.'],
              [
                'difficult',
                'Difficult',
                'Practice hands at basic strategy boundaries.',
              ],
            ] as const
          ).map(([value, label, description]) => (
            <label
              className="stakes-radio strategy-difficulty-choice"
              key={value}
            >
              <input
                type="radio"
                name="strategy-difficulty"
                value={value}
                checked={options.difficulty === value}
                onChange={() => onChange('difficulty', value)}
              />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
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
        description="Answer before time runs out. Timeouts count as incorrect answers. Menus pause the clock."
      />
      <Slider
        id="strategy-seconds"
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
