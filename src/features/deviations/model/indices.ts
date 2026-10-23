import type {
  DeviationIndex,
  DeviationRules,
  DeviationQuestion,
} from './types';

/** Hi-Lo, six-deck shoe, dealer peek, double on any initial two cards.
 * S17: https://wizardofodds.com/games/blackjack/card-counting/high-low/
 * H17 differences: https://www.blackjacktrainer.fyi/charts/deviations/s17
 * All thresholds are normalized: above action applies at TC >= index.
 * I18 drills assume no surrender. Fab 4 drills offer late surrender.
 */
export const DEVIATION_INDICES: readonly DeviationIndex[] = [
  {
    id: 'insurance',
    set: 'illustrious-18',
    total: 'insurance',
    dealer: 'A',
    s17: 3,
    h17: 3,
    above: 'insure',
    below: 'decline',
  },
  {
    id: '16-v-10',
    set: 'illustrious-18',
    total: 16,
    dealer: '10',
    s17: 0,
    h17: 0,
    above: 'stand',
    below: 'hit',
  },
  {
    id: '15-v-10',
    set: 'illustrious-18',
    total: 15,
    dealer: '10',
    s17: 4,
    h17: 4,
    above: 'stand',
    below: 'hit',
  },
  {
    id: 'tens-v-5',
    set: 'illustrious-18',
    total: 'tens',
    dealer: '5',
    s17: 5,
    h17: 5,
    above: 'split',
    below: 'stand',
  },
  {
    id: 'tens-v-6',
    set: 'illustrious-18',
    total: 'tens',
    dealer: '6',
    s17: 4,
    h17: 4,
    above: 'split',
    below: 'stand',
  },
  {
    id: '10-v-10',
    set: 'illustrious-18',
    total: 10,
    dealer: '10',
    s17: 4,
    h17: 4,
    above: 'double',
    below: 'hit',
  },
  {
    id: '12-v-3',
    set: 'illustrious-18',
    total: 12,
    dealer: '3',
    s17: 2,
    h17: 2,
    above: 'stand',
    below: 'hit',
  },
  {
    id: '12-v-2',
    set: 'illustrious-18',
    total: 12,
    dealer: '2',
    s17: 3,
    h17: 3,
    above: 'stand',
    below: 'hit',
  },
  {
    id: '11-v-A',
    set: 'illustrious-18',
    total: 11,
    dealer: 'A',
    s17: 1,
    h17: -1,
    above: 'double',
    below: 'hit',
  },
  {
    id: '9-v-2',
    set: 'illustrious-18',
    total: 9,
    dealer: '2',
    s17: 1,
    h17: 1,
    above: 'double',
    below: 'hit',
  },
  {
    id: '10-v-A',
    set: 'illustrious-18',
    total: 10,
    dealer: 'A',
    s17: 4,
    h17: 3,
    above: 'double',
    below: 'hit',
  },
  {
    id: '9-v-7',
    set: 'illustrious-18',
    total: 9,
    dealer: '7',
    s17: 3,
    h17: 3,
    above: 'double',
    below: 'hit',
  },
  {
    id: '16-v-9',
    set: 'illustrious-18',
    total: 16,
    dealer: '9',
    s17: 5,
    h17: 5,
    above: 'stand',
    below: 'hit',
  },
  {
    id: '13-v-2',
    set: 'illustrious-18',
    total: 13,
    dealer: '2',
    s17: -1,
    h17: -1,
    above: 'stand',
    below: 'hit',
  },
  {
    id: '12-v-4',
    set: 'illustrious-18',
    total: 12,
    dealer: '4',
    s17: 0,
    h17: 0,
    above: 'stand',
    below: 'hit',
  },
  {
    id: '12-v-5',
    set: 'illustrious-18',
    total: 12,
    dealer: '5',
    s17: -2,
    h17: -2,
    above: 'stand',
    below: 'hit',
  },
  {
    id: '12-v-6',
    set: 'illustrious-18',
    total: 12,
    dealer: '6',
    s17: -1,
    h17: -3,
    above: 'stand',
    below: 'hit',
  },
  {
    id: '13-v-3',
    set: 'illustrious-18',
    total: 13,
    dealer: '3',
    s17: -2,
    h17: -2,
    above: 'stand',
    below: 'hit',
  },
  {
    id: 'surrender-14-v-10',
    set: 'fab-4',
    total: 14,
    dealer: '10',
    s17: 3,
    h17: 3,
    above: 'surrender',
    below: 'hit',
  },
  {
    id: 'surrender-15-v-10',
    set: 'fab-4',
    total: 15,
    dealer: '10',
    s17: 0,
    h17: 0,
    above: 'surrender',
    below: 'hit',
  },
  {
    id: 'surrender-15-v-9',
    set: 'fab-4',
    total: 15,
    dealer: '9',
    s17: 2,
    h17: 2,
    above: 'surrender',
    below: 'hit',
  },
  {
    id: 'surrender-15-v-A',
    set: 'fab-4',
    total: 15,
    dealer: 'A',
    s17: 1,
    h17: -1,
    above: 'surrender',
    below: 'hit',
  },
];
export function getDeviationIndex(question: DeviationQuestion): DeviationIndex {
  const index = DEVIATION_INDICES.find(
    (entry) => entry.id === question.indexId,
  );
  if (!index) throw new Error(`Unknown deviation: ${question.indexId}`);
  return index;
}
export const thresholdFor = (index: DeviationIndex, rules: DeviationRules) =>
  rules.hitSoft17 ? index.h17 : index.s17;
export const signedCount = (value: number) =>
  value > 0 ? `+${value}` : String(value);
export function recommendDeviation(
  question: DeviationQuestion,
  rules: DeviationRules,
) {
  const index = getDeviationIndex(question);
  return question.trueCount >= thresholdFor(index, rules)
    ? index.above
    : index.below;
}
