import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStrategyTrainer, FEEDBACK_MS } from './createStrategyTrainer';
import { DEFAULT_STRATEGY_SETTINGS } from './settings';
import { getDifficultHands } from './difficultHands';
import { score, value } from '../../blackjack/model/cards';
import { recommendAction } from './strategy';
import {
  accuracy,
  createBasicStrategyStats,
  createFreePlayStats,
  recordFreePlayRound,
} from '../../stats/sessionStats';

function practice(timed = false) {
  const save = vi.fn();
  const trainer = createStrategyTrainer({
    settings: {
      load: () => ({
        rules: { ...DEFAULT_STRATEGY_SETTINGS.rules },
        options: {
          ...DEFAULT_STRATEGY_SETTINGS.options,
          skipExplanations: true,
          timedHands: timed,
          seconds: 3,
        },
      }),
      save,
    },
    question: (id) => ({
      id,
      cards: [
        { rank: '10', suit: 'S', id: id * 3 },
        { rank: '6', suit: 'H', id: id * 3 + 1 },
      ],
      dealer: { rank: '10', suit: 'C', id: id * 3 + 2 },
    }),
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
describe('rapid-fire practice lifecycle', () => {
  it('runs Difficult indefinitely, rebuilds the pool for rule changes, and can return to Normal', async () => {
    const save = vi.fn();
    const trainer = createStrategyTrainer({
      random: () => 0.4,
      settings: {
        load: () => structuredClone(DEFAULT_STRATEGY_SETTINGS),
        save,
      },
    });
    trainer.configure();
    trainer.updateOption('difficulty', 'difficult');
    expect(trainer.getSnapshot().settings.options.difficulty).toBe('normal');
    trainer.start();
    const disconnect = trainer.connect();
    let attempts = 0;
    for (const hitSoft17 of [false, true])
      for (const doubleAfterSplit of [false, true])
        for (const surrender of [false, true]) {
          trainer.openPanel('rules');
          trainer.updateRule('hitSoft17', hitSoft17);
          trainer.updateRule('doubleAfterSplit', doubleAfterSplit);
          trainer.updateRule('surrender', surrender);
          trainer.closePanel();
          attempts = 0;
          expect(trainer.getSnapshot().state.stats.attempts).toBe(attempts);
          for (let i = 0; i < 4; i++) {
            const { state, settings } = trainer.getSnapshot();
            const question = state.question!;
            const result = score(question.cards);
            const family =
              value(question.cards[0]) === value(question.cards[1])
                ? 'pair'
                : result.soft
                  ? 'soft'
                  : 'hard';
            expect(
              getDifficultHands(settings.rules).some(
                (hand) =>
                  hand.family === family &&
                  hand.total === result.total &&
                  value({ rank: hand.dealerRank }) === value(question.dealer),
              ),
            ).toBe(true);
            trainer.answer(
              recommendAction(question.cards, question.dealer, settings.rules),
            );
            attempts++;
            await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
            expect(trainer.getSnapshot().state.stats.correct).toBe(attempts);
          }
        }
    trainer.openPanel('options');
    trainer.updateOption('difficulty', 'normal');
    trainer.closePanel();
    expect(trainer.getSnapshot().state.stats.attempts).toBe(attempts);
    expect(
      trainer.getSnapshot().state.question!.cards.map((c) => c.rank),
    ).toEqual(['6', '6']);
    expect(save.mock.lastCall?.[0].options.difficulty).toBe('normal');
    disconnect();
  });
  it('grades one decision, prevents duplicate answers, and automatically deals a fresh question', async () => {
    const { trainer, state, disconnect } = practice();
    trainer.answer('hit');
    trainer.answer('stand');
    expect(state().feedback).toMatchObject({ correct: true, expected: 'hit' });
    expect(state().stats).toMatchObject({
      attempts: 1,
      correct: 1,
      incorrect: 0,
    });
    expect(state().question?.cards).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
    expect(state()).toMatchObject({
      phase: 'answering',
      feedback: null,
      question: { id: 2 },
    });
    trainer.answer('stand');
    expect(state().feedback).toMatchObject({
      correct: false,
      selected: 'stand',
      expected: 'hit',
    });
    expect(accuracy(state().stats)).toBe(50);
    disconnect();
  });
  it('keeps dealing indefinitely with a stable count of questions and no growing history', async () => {
    const { trainer, state, disconnect } = practice();
    for (let i = 0; i < 100; i++) {
      trainer.answer('hit');
      await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
    }
    expect(state().stats).toMatchObject({
      attempts: 100,
      correct: 100,
      streak: 100,
      bestStreak: 100,
    });
    expect(state().question?.id).toBe(101);
    disconnect();
  });
  it('counts timeouts as incorrect and reveals the expected action', async () => {
    const { state, disconnect } = practice(true);
    await vi.advanceTimersByTimeAsync(3000);
    expect(state().feedback).toMatchObject({
      correct: false,
      selected: null,
      expected: 'hit',
      timedOut: true,
    });
    expect(state().stats).toMatchObject({
      attempts: 1,
      incorrect: 1,
      timeouts: 1,
    });
    disconnect();
  });
  it('pauses both decision and feedback clocks for menus and inactive modes', async () => {
    const { trainer, state, disconnect } = practice(true);
    await vi.advanceTimersByTimeAsync(1000);
    trainer.openPanel('help');
    await vi.advanceTimersByTimeAsync(10000);
    expect(state().stats.attempts).toBe(0);
    trainer.closePanel();
    trainer.answer('hit');
    await vi.advanceTimersByTimeAsync(400);
    trainer.suspend();
    await vi.advanceTimersByTimeAsync(10000);
    expect(state().question?.id).toBe(1);
    trainer.activate();
    await vi.advanceTimersByTimeAsync(FEEDBACK_MS - 400);
    expect(state().question?.id).toBe(2);
    disconnect();
  });
  it('does not award a point for a late answer at the exact deadline', async () => {
    const { trainer, state, disconnect } = practice(true);
    vi.setSystemTime(Date.now() + 3000);
    trainer.answer('hit');
    expect(state().feedback?.timedOut).toBe(true);
    expect(state().stats.correct).toBe(0);
    disconnect();
  });
  it('starts fresh and grades with the changed rules', async () => {
    const { trainer, state, disconnect } = practice();
    trainer.answer('hit');
    await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
    trainer.openPanel('rules');
    trainer.updateRule('surrender', true);
    trainer.closePanel();
    expect(state().stats.attempts).toBe(0);
    trainer.answer('surrender');
    expect(state().feedback?.correct).toBe(true);
    expect(state().stats.correct).toBe(1);
    disconnect();
  });
  describe.each(['doubleAfterSplit', 'hitSoft17', 'surrender'] as const)(
    '%s changes',
    (rule) => {
      it.each(['answering', 'feedback'] as const)(
        'resets all session stats and the timer during %s',
        async (phase) => {
          const { trainer, state, save, disconnect } = practice(true);
          trainer.answer('hit');
          await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
          trainer.answer('stand');
          await vi.advanceTimersByTimeAsync(FEEDBACK_MS + 3000);
          expect(state().stats).toMatchObject({
            attempts: 3,
            correct: 1,
            incorrect: 2,
            timeouts: 1,
            bestStreak: 1,
          });
          if (phase === 'answering')
            await vi.advanceTimersByTimeAsync(FEEDBACK_MS + 1000);
          const oldQuestion = state().question!.id;
          trainer.openPanel('rules');
          const newValue = !trainer.getSnapshot().settings.rules[rule];
          trainer.updateRule(rule, newValue);
          expect(state().stats).toEqual(createBasicStrategyStats());
          expect(state()).toMatchObject({
            phase: 'answering',
            feedback: null,
            panel: 'rules',
          });
          expect(state().question!.id).toBeGreaterThan(oldQuestion);
          expect(trainer.getSnapshot().timerSeconds).toBe(3);
          expect(save.mock.lastCall?.[0].rules[rule]).toBe(newValue);
          await vi.advanceTimersByTimeAsync(10000);
          expect(state().stats.attempts).toBe(0);
          trainer.closePanel();
          await vi.advanceTimersByTimeAsync(2950);
          expect(state().stats.attempts).toBe(0);
          await vi.advanceTimersByTimeAsync(50);
          expect(state().stats).toMatchObject({
            attempts: 1,
            correct: 0,
            timeouts: 1,
          });
          disconnect();
        },
      );
    },
  );
  it('preserves the session when opening rules or setting an unchanged rule value', () => {
    const { trainer, state, disconnect } = practice();
    trainer.answer('hit');
    const before = state();
    trainer.openPanel('rules');
    trainer.updateRule('hitSoft17', false);
    trainer.closePanel();
    expect(state().stats).toEqual(before.stats);
    expect(state().question).toEqual(before.question);
    expect(state().feedback).toEqual(before.feedback);
    disconnect();
  });
  it('rejects split and surrender when unavailable', () => {
    const { trainer, state, disconnect } = practice();
    trainer.answer('split');
    trainer.answer('surrender');
    expect(state().stats.attempts).toBe(0);
    disconnect();
  });
  it('discards setup drafts and resets only the Basic Strategy counters', () => {
    const { trainer, state, save, disconnect } = practice();
    const freePlay = recordFreePlayRound(
      createFreePlayStats(),
      ['WIN', 'LOSE', 'PUSH'],
      25,
    );
    trainer.answer('hit');
    trainer.configure();
    trainer.updateRule('hitSoft17', true);
    trainer.updateOption('difficulty', 'difficult');
    trainer.backToMenu();
    expect(state().stats.attempts).toBe(1);
    expect(trainer.getSnapshot().settings.rules.hitSoft17).toBe(false);
    expect(trainer.getSnapshot().settings.options.difficulty).toBe('normal');
    expect(save).toHaveBeenCalledTimes(1);
    trainer.start();
    expect(state().stats.attempts).toBe(0);
    expect(freePlay).toMatchObject({
      modeId: 'free-play',
      wins: 1,
      losses: 1,
      pushes: 1,
      sessionNet: 25,
    });
    disconnect();
  });
});
