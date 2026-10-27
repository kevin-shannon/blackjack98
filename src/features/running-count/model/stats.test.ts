import { describe, expect, it } from 'vitest';
import { createRunningCountTrainer } from './createRunningCountTrainer';
import { DEFAULT_COUNT_OPTIONS } from './settings';
import { createPracticeStats } from '../../stats/sessionStats';
import {
  countAccuracy,
  createCountStats,
  recordCountAnswer,
  trueCountAnswerScore,
} from './stats';

describe('True Count partial credit', () => {
  it('handles an older live session without a partial-credit total', () => {
    const oldSession = {
      ...createPracticeStats('running-count'),
      attempts: 2,
      correct: 1,
      incorrect: 1,
    };
    expect(countAccuracy(oldSession)).toBe(50);
    expect(countAccuracy(createPracticeStats('running-count'))).toBe(0);
    const next = recordCountAnswer(oldSession, 'true-count', -3, -2);
    expect(next.accuracyPoints).toBe(190);
    expect(countAccuracy(next)).toBeCloseTo(190 / 3);
    expect(next.attempts).toBe(3);
  });

  it.each([NaN, Infinity, -Infinity])(
    'recovers an invalid score total of %s when recording the next answer',
    (accuracyPoints) => {
      const stats = {
        ...createCountStats(),
        attempts: 1,
        correct: 1,
        accuracyPoints,
      };
      expect(countAccuracy(stats)).toBe(100);
      const next = recordCountAnswer(stats, 'true-count', 3, 2);
      expect(next.accuracyPoints).toBe(190);
      expect(countAccuracy(next)).toBe(95);
    },
  );

  it.each([
    [2, 2, 100],
    [3, 2, 90],
    [1, 2, 90],
    [-3, -2, 90],
    [-1, -2, 90],
    [0, 0, 100],
    [-1, 0, 90],
    [1, 0, 90],
    [0, -2, 80],
    [2, -2, 60],
    [10, 0, 0],
    [-48, 48, 0],
    [Number.MAX_SAFE_INTEGER, -48, 0],
  ])('scores answer %s against %s as %s%%', (answer, expected, score) => {
    expect(trueCountAnswerScore(answer, expected)).toBe(score);
  });

  it('averages scores equally across questions and keeps exact-answer streaks', () => {
    let stats = createCountStats();
    expect(countAccuracy(stats)).toBe(0);
    stats = recordCountAnswer(stats, 'true-count', -3, -2);
    expect(countAccuracy(stats)).toBe(90);
    stats = recordCountAnswer(stats, 'true-count', 2, 2);
    expect(countAccuracy(stats)).toBe(95);
    expect(stats).toMatchObject({ attempts: 2, correct: 1, streak: 1 });
    stats = recordCountAnswer(stats, 'true-count', 48, -48);
    expect(countAccuracy(stats)).toBeCloseTo(190 / 3);
    expect(stats).toMatchObject({ attempts: 3, streak: 0, bestStreak: 1 });
  });

  it.each(['running-count', 'deck-estimation'] as const)(
    'keeps %s accuracy based on exact answers',
    (test) => {
      let stats = recordCountAnswer(createCountStats(), test, 3, 2);
      expect(countAccuracy(stats)).toBe(0);
      stats = recordCountAnswer(stats, test, 2, 2);
      expect(countAccuracy(stats)).toBe(50);
    },
  );

  it('records partial credit once, discards option drafts, and clears scores on test changes and new sessions', () => {
    const trainer = createRunningCountTrainer({
      random: () => 0.4,
      settings: {
        load: () => ({ ...DEFAULT_COUNT_OPTIONS, test: 'true-count' }),
        save: () => {},
      },
    });
    trainer.configure();
    trainer.start();
    expect(trainer.getSnapshot().state.question?.expected).toBe(-2);
    trainer.submitCount(-3);
    trainer.submitCount(-2);
    expect(countAccuracy(trainer.getSnapshot().state.stats)).toBe(90);
    expect(trainer.getSnapshot().state.stats.attempts).toBe(1);
    trainer.continuePractice();
    trainer.submitCount(-2);
    expect(countAccuracy(trainer.getSnapshot().state.stats)).toBe(95);
    trainer.openPanel('options');
    trainer.updateOption('test', 'deck-estimation');
    trainer.closePanel();
    expect(countAccuracy(trainer.getSnapshot().state.stats)).toBe(95);
    trainer.openPanel('options');
    trainer.updateOption('test', 'deck-estimation');
    trainer.applySettings();
    expect(trainer.getSnapshot().state.stats).toEqual(createCountStats());
    trainer.closePanel();
    trainer.submitCount(2.5);
    expect(countAccuracy(trainer.getSnapshot().state.stats)).toBe(100);
    trainer.start();
    expect(trainer.getSnapshot().state.stats).toEqual(createCountStats());
  });
});
