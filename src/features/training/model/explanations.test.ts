import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStrategyTrainer } from '../../basic-strategy/model/createStrategyTrainer';
import { DEFAULT_STRATEGY_SETTINGS } from '../../basic-strategy/model/settings';
import { createDeviationTrainer } from '../../deviations/model/createDeviationTrainer';
import { DEFAULT_DEVIATION_SETTINGS } from '../../deviations/model/settings';
import { FEEDBACK_MS } from './createDecisionTrainer';
import type { TimedPracticeOptions } from './types';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe.each(['basic-strategy', 'deviations'] as const)(
  '%s explanations',
  (mode) => {
    function practice(skipExplanations = false) {
      const save = vi.fn();
      const store =
        mode === 'basic-strategy'
          ? createStrategyTrainer({
              settings: {
                load: () => structuredClone(DEFAULT_STRATEGY_SETTINGS),
                save,
              },
              question: (id) => ({
                id,
                cards: [
                  { rank: '10', suit: 'S', id: id * 3 },
                  { rank: '6', suit: 'H', id: id * 3 + 1 },
                ],
                dealer: { rank: '10', suit: 'D', id: id * 3 + 2 },
              }),
            })
          : createDeviationTrainer({
              settings: {
                load: () => structuredClone(DEFAULT_DEVIATION_SETTINGS),
                save,
              },
              question: (id) => ({
                id,
                cards: [
                  { rank: '10', suit: 'S', id: id * 3 },
                  { rank: '2', suit: 'H', id: id * 3 + 1 },
                ],
                dealer: { rank: '3', suit: 'D', id: id * 3 + 2 },
                indexId: '12-v-3',
                trueCount: 1,
              }),
            });
      const updateOption = store.updateOption as <
        K extends keyof TimedPracticeOptions,
      >(
        key: K,
        value: TimedPracticeOptions[K],
      ) => void;
      const trainer = { ...store, updateOption };
      trainer.configure();
      trainer.updateOption('skipExplanations', skipExplanations);
      trainer.updateOption('timedHands', true);
      trainer.updateOption('seconds', 3);
      trainer.start();
      const disconnect = trainer.connect();
      return {
        trainer,
        disconnect,
        save,
        state: () => trainer.getSnapshot().state,
      };
    }
    it('discards a run and its pending timers without losing saved options', async () => {
      const { trainer, state, disconnect } = practice();
      const savedSettings = trainer.getSnapshot().settings;
      trainer.answer('stand');
      expect(state().stats.attempts).toBe(1);
      trainer.configure();
      trainer.updateOption('skipExplanations', true);
      trainer.discardSession();
      await vi.advanceTimersByTimeAsync(60000);
      expect(state()).toMatchObject({
        started: false,
        panel: 'menu',
        phase: 'idle',
        question: null,
        feedback: null,
        stats: {
          attempts: 0,
          correct: 0,
          incorrect: 0,
          streak: 0,
          bestStreak: 0,
          timeouts: 0,
        },
      });
      expect(trainer.getSnapshot().settings).toEqual(savedSettings);
      expect(trainer.getSnapshot().draft).toBeNull();
      trainer.configure();
      trainer.start();
      expect(state()).toMatchObject({
        started: true,
        phase: 'answering',
        stats: { attempts: 0 },
      });
      expect(trainer.getSnapshot().timerSeconds).toBe(3);
      disconnect();
    });
    it('waits indefinitely after a mistake or timeout until Next hand, without scoring twice', async () => {
      const { trainer, state, disconnect } = practice();
      trainer.nextHand();
      expect(state().question!.id).toBe(1);
      trainer.answer('stand');
      expect(state()).toMatchObject({
        phase: 'review',
        feedback: { correct: false, expected: 'hit' },
      });
      expect(state().feedback!.explanation.length).toBeGreaterThan(20);
      expect(trainer.getSnapshot().timerSeconds).toBeNull();
      await vi.advanceTimersByTimeAsync(120000);
      trainer.answer('hit');
      expect(state().question!.id).toBe(1);
      expect(state().stats).toMatchObject({
        attempts: 1,
        incorrect: 1,
        timeouts: 0,
      });
      trainer.nextHand();
      trainer.nextHand();
      expect(state()).toMatchObject({
        phase: 'answering',
        question: { id: 2 },
        feedback: null,
      });
      expect(trainer.getSnapshot().timerSeconds).toBe(3);
      await vi.advanceTimersByTimeAsync(3000);
      expect(state()).toMatchObject({
        phase: 'review',
        feedback: { timedOut: true },
      });
      await vi.advanceTimersByTimeAsync(120000);
      expect(state().stats).toMatchObject({
        attempts: 2,
        incorrect: 2,
        timeouts: 1,
      });
      expect(state().question!.id).toBe(2);
      disconnect();
    });
    it('still advances correct answers automatically and honors Skip explanations after mistakes', async () => {
      const { trainer, state, disconnect } = practice(true);
      trainer.answer('stand');
      expect(state().phase).toBe('feedback');
      await vi.advanceTimersByTimeAsync(FEEDBACK_MS - 50);
      expect(state().question!.id).toBe(1);
      await vi.advanceTimersByTimeAsync(50);
      expect(state().question!.id).toBe(2);
      trainer.openPanel('options');
      trainer.updateOption('skipExplanations', false);
      trainer.closePanel();
      trainer.answer('hit');
      trainer.nextHand(); // Cannot bypass correct-answer feedback.
      expect(state().phase).toBe('feedback');
      expect(state().question!.id).toBe(2);
      await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
      expect(state().question!.id).toBe(3);
      expect(state().stats).toMatchObject({
        attempts: 2,
        correct: 1,
        incorrect: 1,
      });
      disconnect();
    });
    it('holds manual review across menus, suspension, and timer edits, and applies preference changes safely', async () => {
      const { trainer, state, save, disconnect } = practice();
      trainer.answer('stand');
      trainer.openPanel('options');
      trainer.updateOption('seconds', 4);
      trainer.nextHand();
      await vi.advanceTimersByTimeAsync(10000);
      trainer.closePanel();
      trainer.suspend();
      await vi.advanceTimersByTimeAsync(10000);
      trainer.activate();
      await vi.advanceTimersByTimeAsync(10000);
      expect(state()).toMatchObject({ phase: 'review', question: { id: 1 } });
      trainer.openPanel('options');
      trainer.updateOption('skipExplanations', true);
      expect(save.mock.lastCall![0].options.skipExplanations).toBe(true);
      await vi.advanceTimersByTimeAsync(10000); // Options still pause automatic feedback.
      expect(state().question!.id).toBe(1);
      trainer.closePanel();
      await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
      expect(state().question!.id).toBe(2);
      trainer.answer('stand');
      await vi.advanceTimersByTimeAsync(400);
      trainer.openPanel('options');
      trainer.updateOption('skipExplanations', false);
      trainer.closePanel();
      await vi.advanceTimersByTimeAsync(10000);
      expect(state()).toMatchObject({ phase: 'review', question: { id: 2 } });
      expect(state().stats.attempts).toBe(2);
      disconnect();
    });
    it('preserves an active decision timer when changing the explanation preference', async () => {
      const { trainer, state, disconnect } = practice();
      await vi.advanceTimersByTimeAsync(1000);
      trainer.openPanel('options');
      trainer.updateOption('skipExplanations', true);
      trainer.closePanel();
      expect(trainer.getSnapshot().timerSeconds).toBe(2);
      await vi.advanceTimersByTimeAsync(2000);
      expect(state()).toMatchObject({
        phase: 'feedback',
        feedback: { timedOut: true },
      });
      disconnect();
    });
  },
);
