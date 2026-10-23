import { describe, expect, it } from 'vitest';
import { score, value } from '../../blackjack/model/cards';
import { DEVIATION_INDICES, recommendDeviation, thresholdFor } from './indices';
import { dealDeviationQuestion } from './questions';
import { DEFAULT_DEVIATION_SETTINGS, parseDeviationSettings } from './settings';

it('contains exactly the Illustrious 18 and Fab 4 with the sourced S17 / H17 thresholds', () => {
  expect(
    DEVIATION_INDICES.map((entry) => [entry.id, entry.s17, entry.h17]),
  ).toEqual([
    ['insurance', 3, 3],
    ['16-v-10', 0, 0],
    ['15-v-10', 4, 4],
    ['tens-v-5', 5, 5],
    ['tens-v-6', 4, 4],
    ['10-v-10', 4, 4],
    ['12-v-3', 2, 2],
    ['12-v-2', 3, 3],
    ['11-v-A', 1, -1],
    ['9-v-2', 1, 1],
    ['10-v-A', 4, 3],
    ['9-v-7', 3, 3],
    ['16-v-9', 5, 5],
    ['13-v-2', -1, -1],
    ['12-v-4', 0, 0],
    ['12-v-5', -2, -2],
    ['12-v-6', -1, -3],
    ['13-v-3', -2, -2],
    ['surrender-14-v-10', 3, 3],
    ['surrender-15-v-10', 0, 0],
    ['surrender-15-v-9', 2, 2],
    ['surrender-15-v-A', 1, -1],
  ]);
  expect(
    DEVIATION_INDICES.filter((entry) => entry.set === 'illustrious-18'),
  ).toHaveLength(18);
  expect(
    DEVIATION_INDICES.filter((entry) => entry.set === 'fab-4'),
  ).toHaveLength(4);
});

describe.each([false, true])('H17=%s', (hitSoft17) => {
  const rules = { hitSoft17 };
  it.each(DEVIATION_INDICES)(
    'deals and grades both sides of $id without off-by-one errors',
    (entry) => {
      const index = DEVIATION_INDICES.indexOf(entry);
      const threshold = thresholdFor(entry, rules);
      for (const below of [false, true]) {
        const numbers = [(index + 0.5) / 22, below ? 0.25 : 0.75];
        const question = dealDeviationQuestion(
          () => numbers.shift() ?? 0.4,
          index + 1,
          {
            ...DEFAULT_DEVIATION_SETTINGS,
            rules,
          },
        );
        expect(question.indexId).toBe(entry.id);
        expect(question.trueCount).toBe(threshold - Number(below));
        expect(value(question.dealer)).toBe(value({ rank: entry.dealer }));
        expect(recommendDeviation(question, rules)).toBe(
          below ? entry.below : entry.above,
        );
        // The same grading must also work beyond the immediately adjacent counts.
        expect(
          recommendDeviation({ ...question, trueCount: threshold + 10 }, rules),
        ).toBe(entry.above);
        expect(
          recommendDeviation({ ...question, trueCount: threshold - 10 }, rules),
        ).toBe(entry.below);
        const total = score(question.cards);
        if (typeof entry.total === 'number') {
          expect(total).toMatchObject({
            total: entry.total,
            soft: false,
            blackjack: false,
          });
          expect(value(question.cards[0])).not.toBe(value(question.cards[1]));
        } else if (entry.total === 'tens') {
          expect(question.cards.map(value)).toEqual([10, 10]);
        } else expect(question.dealer.rank).toBe('A');
        expect(
          new Set([...question.cards, question.dealer].map((card) => card.id))
            .size,
        ).toBe(3);
      }
    },
  );
});

it.each(['illustrious-18', 'fab-4'] as const)(
  'samples only the selected %s set and allows repeats indefinitely',
  (set) => {
    const settings = {
      ...DEFAULT_DEVIATION_SETTINGS,
      options: { ...DEFAULT_DEVIATION_SETTINGS.options, set },
    };
    const entries = DEVIATION_INDICES.filter((entry) => entry.set === set);
    entries.forEach((entry, index) => {
      const numbers = [(index + 0.5) / entries.length, 0.25];
      expect(
        dealDeviationQuestion(() => numbers.shift() ?? 0.4, 1, settings)
          .indexId,
      ).toBe(entry.id);
    });
    const first = dealDeviationQuestion(() => 0.4, 1, settings);
    for (let id = 2; id <= 100; id++) {
      const question = dealDeviationQuestion(() => 0.4, id, settings);
      expect(question.indexId).toBe(first.indexId);
      expect(question.trueCount).toBe(first.trueCount);
      expect(question.id).toBe(id);
    }
  },
);

it('validates its own preferences and safely defaults absent or invalid values', () => {
  expect(parseDeviationSettings(null)).toEqual(DEFAULT_DEVIATION_SETTINGS);
  expect(
    parseDeviationSettings({
      rules: { hitSoft17: 'yes' },
      options: { set: 'all', timedHands: 'yes', seconds: Infinity },
    }),
  ).toEqual(DEFAULT_DEVIATION_SETTINGS);
  expect(
    parseDeviationSettings({
      rules: { hitSoft17: true },
      options: { set: 'fab-4', timedHands: true, seconds: 1 },
    }),
  ).toEqual({
    rules: { hitSoft17: true },
    options: {
      set: 'fab-4',
      skipExplanations: false,
      timedHands: true,
      seconds: 3,
    },
  });
});
