import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createDeviationTrainer } from './createDeviationTrainer';
import { DEFAULT_DEVIATION_SETTINGS } from './settings';
import { createPracticeStats } from '../../stats/sessionStats';
import { FEEDBACK_MS } from '../../training/model/createDecisionTrainer';
import type { DeviationQuestion } from './types';

const question = (id: number): DeviationQuestion => ({
  id,
  indexId: '12-v-3',
  trueCount: id % 2 ? 1 : 2,
  cards: [
    { rank: '10', suit: 'S', id: id * 3 },
    { rank: '2', suit: 'H', id: id * 3 + 1 },
  ],
  dealer: { rank: '3', suit: 'D', id: id * 3 + 2 },
});
function practice() {
  const save = vi.fn();
  const trainer = createDeviationTrainer({
    settings: { load: () => structuredClone(DEFAULT_DEVIATION_SETTINGS), save },
    question,
  });
  trainer.configure();
  trainer.start();
  const disconnect = trainer.connect();
  return {
    trainer,
    save,
    disconnect,
    state: () => trainer.getSnapshot().state,
  };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('grades boundary counts independently and advances infinitely with isolated stats', async () => {
  const { trainer, state, disconnect } = practice();
  for (let i = 1; i <= 100; i++) {
    trainer.answer(i % 2 ? 'hit' : 'stand');
    trainer.answer('double'); // Duplicate answers cannot change the score.
    expect(state().feedback?.correct).toBe(true);
    await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
  }
  expect(state().stats).toMatchObject({
    modeId: 'deviations',
    attempts: 100,
    correct: 100,
    streak: 100,
    bestStreak: 100,
  });
  expect(state().question?.id).toBe(101);
  disconnect();
});
it('provides specialized insurance actions and forbids unrelated play actions', () => {
  const trainer = createDeviationTrainer({
    settings: {
      load: () => structuredClone(DEFAULT_DEVIATION_SETTINGS),
      save() {},
    },
    question: (id) => ({
      ...question(id),
      indexId: 'insurance',
      trueCount: 3,
      dealer: { rank: 'A', suit: 'S', id: 999 },
    }),
  });
  trainer.start();
  trainer.answer('hit');
  expect(trainer.getSnapshot().state.stats.attempts).toBe(0);
  trainer.answer('insure');
  expect(trainer.getSnapshot().state.feedback).toMatchObject({
    correct: true,
    expected: 'insure',
  });
});
it('keeps I18 stand/hit questions distinct from Fab 4 surrender questions on the same hand', () => {
  for (const [indexId, trueCount, action] of [
    ['15-v-10', 4, 'stand'],
    ['surrender-15-v-10', 0, 'surrender'],
  ] as const) {
    const trainer = createDeviationTrainer({
      settings: {
        load: () => structuredClone(DEFAULT_DEVIATION_SETTINGS),
        save() {},
      },
      question: (id) => ({
        ...question(id),
        indexId,
        trueCount,
        cards: [
          { rank: '10', suit: 'S', id: 1 },
          { rank: '5', suit: 'H', id: 2 },
        ],
        dealer: { rank: '10', suit: 'D', id: 3 },
      }),
    });
    trainer.start();
    expect(trainer.canAnswer('surrender')).toBe(
      indexId.startsWith('surrender'),
    );
    trainer.answer(action);
    expect(trainer.getSnapshot().state.feedback?.correct).toBe(true);
  }
});
it('pauses timers on menus and mode switches and resets only this session on rule or set changes', async () => {
  const { trainer, state, disconnect } = practice();
  trainer.answer('hit');
  trainer.openPanel('help');
  await vi.advanceTimersByTimeAsync(10000);
  expect(state().question?.id).toBe(1);
  trainer.closePanel();
  trainer.suspend();
  await vi.advanceTimersByTimeAsync(10000);
  expect(state().question?.id).toBe(1);
  trainer.activate();
  await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
  trainer.openPanel('rules');
  trainer.updateRule('hitSoft17', true);
  trainer.applySettings();
  expect(state().stats).toEqual(createPracticeStats('deviations'));
  expect(state().feedback).toBeNull();
  trainer.closePanel();
  trainer.answer('hit');
  trainer.openPanel('options');
  trainer.updateOption('set', 'fab-4');
  trainer.applySettings();
  expect(state().stats.attempts).toBe(0);
  trainer.updateOption('timedHands', true);
  trainer.applySettings();
  trainer.updateOption('seconds', 3);
  trainer.applySettings();
  trainer.closePanel();
  await vi.advanceTimersByTimeAsync(3000);
  expect(state().stats).toMatchObject({
    attempts: 1,
    timeouts: 1,
    incorrect: 1,
  });
  disconnect();
});
it('discards setup drafts and saves only the selected settings at Start', () => {
  const { trainer, save, disconnect } = practice();
  trainer.answer('hit');
  trainer.configure();
  trainer.updateRule('hitSoft17', true);
  trainer.updateOption('set', 'fab-4');
  trainer.backToMenu();
  expect(trainer.getSnapshot().settings).toEqual(DEFAULT_DEVIATION_SETTINGS);
  expect(trainer.getSnapshot().state.stats.correct).toBe(1);
  trainer.configure();
  trainer.updateRule('hitSoft17', true);
  trainer.start();
  expect(save.mock.lastCall?.[0].rules.hitSoft17).toBe(true);
  disconnect();
});
