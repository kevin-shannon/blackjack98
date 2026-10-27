import { describe, expect, it, vi } from 'vitest';
import { createCountQuestion, DECK_STEPS, validCountAnswer } from './questions';
import { DEFAULT_COUNT_OPTIONS, parseCountOptions } from './settings';
import { createRunningCountTrainer } from './createRunningCountTrainer';

describe('counting test questions', () => {
  it('covers every half-deck estimate uniformly from 0.5 through 6', () => {
    expect(DECK_STEPS).toEqual([
      0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6,
    ]);
    DECK_STEPS.forEach((decks, index) => {
      expect(
        createCountQuestion('deck-estimation', () => (index + 0.5) / 12),
      ).toEqual({
        kind: 'deck-estimation',
        decksRemaining: decks,
        expected: decks,
        totalDecks: 6,
      });
    });
  });
  it.each([
    [5, 2, 2],
    [-5, 2, -2],
    [-4, 2, -2],
    [0, 0.5, 0],
    [7, 3.5, 2],
    [11, 3, 3],
    [-11, 3, -3],
    [-1, 6, 0],
    [24, 0.5, 48],
  ])(
    'divides %s by %s and truncates toward zero to %s',
    (count, decks, expected) => {
      let draw = 0;
      const random = () =>
        draw++ === 0
          ? (DECK_STEPS.indexOf(decks) + 0.5) / 12
          : (count + 24 + 0.5) / 49;
      expect(createCountQuestion('true-count', random)).toEqual({
        kind: 'true-count',
        runningCount: count,
        decksRemaining: decks,
        expected,
      });
    },
  );
  it('accepts half-deck estimates but rejects out-of-range or fractional integer-count answers', () => {
    for (const answer of DECK_STEPS)
      expect(validCountAnswer('deck-estimation', answer)).toBe(true);
    for (const answer of [0, 0.25, 1.2, 6.5, -1, NaN, Infinity])
      expect(validCountAnswer('deck-estimation', answer)).toBe(false);
    for (const test of ['running-count', 'true-count'] as const) {
      expect(validCountAnswer(test, -3)).toBe(true);
      expect(validCountAnswer(test, 0)).toBe(true);
      expect(validCountAnswer(test, -2.5)).toBe(false);
    }
  });
  it('migrates old preferences to Running Count and preserves the selected test', () => {
    expect(parseCountOptions({ pace: 8, askEvery: 4 })).toEqual({
      test: 'running-count',
      pace: 8,
      askEvery: 4,
    });
    expect(parseCountOptions({ test: 'invalid' }).test).toBe('running-count');
    for (const test of [
      'running-count',
      'deck-estimation',
      'true-count',
    ] as const)
      expect(parseCountOptions({ test }).test).toBe(test);
  });
});

it.each(['deck-estimation', 'true-count'] as const)(
  '%s runs indefinitely, waits after mistakes, and resets accuracy only on committed test changes',
  async (test) => {
    vi.useFakeTimers();
    const save = vi.fn();
    const trainer = createRunningCountTrainer({
      random: () => 0.4,
      settings: { load: () => ({ ...DEFAULT_COUNT_OPTIONS, test }), save },
    });
    trainer.configure();
    trainer.start();
    const disconnect = trainer.connect();
    try {
      for (let number = 1; number <= 5; number++) {
        const { state } = trainer.getSnapshot();
        expect(state.round).toBe(number);
        expect(state.phase).toBe('question');
        expect(state.question?.kind).toBe(test);
        expect(state.hands).toHaveLength(0);
        await vi.advanceTimersByTimeAsync(10000);
        expect(trainer.getSnapshot().state.round).toBe(number);
        trainer.submitCount(state.question!.expected);
        expect(trainer.getSnapshot().state.stats.correct).toBe(number);
        await vi.advanceTimersByTimeAsync(1100);
      }
      trainer.openPanel('options');
      trainer.updateOption('test', 'running-count');
      trainer.closePanel();
      expect(trainer.getSnapshot().options.test).toBe(test);
      expect(trainer.getSnapshot().state.stats.correct).toBe(5);
      const question = trainer.getSnapshot().state.question!;
      const wrong = question.expected === 1 ? 2 : 1;
      trainer.submitCount(wrong);
      expect(trainer.getSnapshot().state.feedback?.correct).toBe(false);
      await vi.advanceTimersByTimeAsync(60000);
      expect(trainer.getSnapshot().state.phase).toBe('feedback');
      trainer.continuePractice();
      expect(trainer.getSnapshot().state.phase).toBe('question');
      trainer.openPanel('options');
      trainer.updateOption('test', 'running-count');
      trainer.applySettings();
      expect(trainer.getSnapshot().state.stats.attempts).toBe(0);
      expect(trainer.getSnapshot().state.round).toBe(1);
      expect(trainer.getSnapshot().state.panel).toBe('options');
      trainer.closePanel();
      expect(trainer.getSnapshot().state.phase).toBe('playing');
      expect(trainer.getSnapshot().state.question).toBeNull();
      expect(save.mock.lastCall?.[0].test).toBe('running-count');
    } finally {
      disconnect();
      vi.useRealTimers();
    }
  },
);
