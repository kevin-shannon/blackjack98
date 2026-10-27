import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRunningCountTrainer } from './createRunningCountTrainer';
import {
  DEFAULT_COUNT_OPTIONS,
  paceDelay,
  parseCountOptions,
} from './settings';
import { hiLo, score } from '../../blackjack/model/cards';
import type { Rank } from '../../blackjack/model/types';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
function practice(ranks: Rank[], askEvery = 1, padding = true, pace = 10) {
  const save = vi.fn();
  const createShoe = vi.fn(() =>
    [...ranks, ...(padding ? Array<Rank>(100).fill('7') : [])].map((rank) => ({
      rank,
      suit: 'S' as const,
    })),
  );
  const trainer = createRunningCountTrainer({
    random: () => 0.4,
    createShoe,
    settings: { load: () => ({ test: 'running-count', pace, askEvery }), save },
  });
  trainer.configure();
  trainer.start();
  const disconnect = trainer.connect();
  const state = () => trainer.getSnapshot().state;
  async function until(predicate: () => boolean) {
    for (let step = 0; step < 600 && !predicate(); step++)
      await vi.advanceTimersByTimeAsync(150);
    expect(predicate()).toBe(true);
  }
  return { trainer, state, save, createShoe, until, disconnect };
}
describe('automatic running-count practice', () => {
  it.each([1, 5, 10])(
    'waits two seconds before the initial player action at pace %s',
    async (pace) => {
      const { state, disconnect } = practice(
        ['9', '6', '2', '10', '10', '5'],
        1,
        true,
        pace,
      );
      const delay = paceDelay({ test: 'running-count', pace, askEvery: 1 });
      await vi.advanceTimersByTimeAsync(Math.max(1500, delay) + 3 * delay);
      expect(state().dealer).toHaveLength(2);
      expect(state().hands[0].cards).toHaveLength(2);
      expect(state().message).toBe('Player is deciding.');
      await vi.advanceTimersByTimeAsync(1999);
      expect(state().hands[0].cards).toHaveLength(2);
      expect(state().dealerRevealed).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(state().hands[0].cards).toHaveLength(3);
      expect(state().hands[0].doubled).toBe(true);
      disconnect();
    },
  );
  it('preserves the initial decision pause when opening menus and changing pace', async () => {
    const { trainer, state, disconnect } = practice(
      ['9', '6', '2', '10', '10', '5'],
      1,
      true,
      1,
    );
    await vi.advanceTimersByTimeAsync(8500);
    trainer.openPanel('options');
    trainer.updateOption('pace', 10);
    trainer.applySettings();
    await vi.advanceTimersByTimeAsync(60000);
    trainer.closePanel();
    await vi.advanceTimersByTimeAsync(1499);
    expect(state().hands[0].cards).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(state().hands[0].doubled).toBe(true);
    disconnect();
  });
  it('plays through multiple real six-deck shoes with an independently verified exposed-card count', async () => {
    let seed = 42;
    const trainer = createRunningCountTrainer({
      random: () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      },
      settings: {
        load: () => ({ test: 'running-count', pace: 10, askEvery: 3 }),
        save: vi.fn(),
      },
    });
    trainer.configure();
    trainer.start();
    const disconnect = trainer.connect();
    let shoeNumber = 0,
      expected = 0;
    const seen = new Set<number>();
    const copies = new Map<string, number>();
    for (let tick = 0; tick < 10000; tick++) {
      const { state, shoeTotal } = trainer.getSnapshot();
      expect(shoeTotal).toBe(312);
      if (state.shoeNumber !== shoeNumber) {
        shoeNumber = state.shoeNumber;
        expected = 0;
        seen.clear();
        copies.clear();
      }
      const exposed = [
        ...state.hands.flatMap((hand) => hand.cards),
        ...state.dealer.filter(
          (_, index) => index !== 1 || state.dealerRevealed,
        ),
      ];
      for (const card of exposed) {
        if (seen.has(card.id)) continue;
        seen.add(card.id);
        expected += hiLo(card);
        const key = card.rank + card.suit;
        copies.set(key, (copies.get(key) || 0) + 1);
        expect(copies.get(key)).toBeLessThanOrEqual(6);
      }
      expect(state.runningCount).toBe(expected);
      expect(state.hands.length).toBeLessThanOrEqual(4);
      if (state.completedRounds >= 100) break;
      if (state.phase === 'question') trainer.submitCount(expected);
      await vi.advanceTimersByTimeAsync(150);
    }
    expect(trainer.getSnapshot().state.completedRounds).toBeGreaterThanOrEqual(
      100,
    );
    expect(shoeNumber).toBeGreaterThan(1);
    expect(trainer.getSnapshot().state.stats.incorrect).toBe(0);
    disconnect();
  });
  it('counts exposed cards, reveals the hole card exactly once, and grades only one answer', async () => {
    const { trainer, state, until, disconnect } = practice([
      '10',
      '6',
      '7',
      '2',
      '9',
    ]);
    await until(() => state().dealer.length === 2);
    expect(state().dealerRevealed).toBe(false);
    expect(state().runningCount).toBe(0);
    await until(() => state().dealerRevealed);
    expect(state().runningCount).toBe(1);
    await until(() => state().phase === 'question');
    expect(state().dealer.map((card) => card.rank)).toEqual(['6', '2', '9']);
    expect(state().runningCount).toBe(1);
    expect(state().completedRounds).toBe(1);
    const held = trainer.getSnapshot();
    await vi.advanceTimersByTimeAsync(60000);
    expect(trainer.getSnapshot()).toEqual(held);
    trainer.submitCount(1.5);
    expect(state().stats.attempts).toBe(0);
    trainer.submitCount(1);
    trainer.submitCount(1);
    expect(state().stats).toMatchObject({
      modeId: 'running-count',
      attempts: 1,
      correct: 1,
      streak: 1,
    });
    await vi.advanceTimersByTimeAsync(1100);
    expect(state().round).toBe(2);
    expect(state().phase).toBe('playing');
    disconnect();
  });
  it('plays splits and DAS automatically, without counting transferred cards twice', async () => {
    const { state, until, disconnect } = practice([
      '8',
      '6',
      '8',
      '10',
      '3',
      '2',
      '10',
      '9',
      '5',
    ]);
    await until(() => state().phase === 'question');
    expect(
      state().hands.map((hand) => hand.cards.map((card) => card.rank)),
    ).toEqual([
      ['8', '3', '10'],
      ['8', '2', '9'],
    ]);
    expect(state().hands.every((hand) => hand.doubled && hand.complete)).toBe(
      true,
    );
    expect(state().hands.map((hand) => hand.result)).toEqual(['PUSH', 'LOSE']);
    expect(state().runningCount).toBe(2);
    expect(state().runningCount).toBe(
      [
        ...state().dealer,
        ...state().hands.flatMap((hand) => hand.cards),
      ].reduce((sum, card) => sum + hiLo(card), 0),
    );
    disconnect();
  });
  it('gives split Aces one card and does not resplit them', async () => {
    const { state, until, disconnect } = practice([
      'A',
      '6',
      'A',
      '10',
      'A',
      '8',
      '5',
    ]);
    await until(() => state().phase === 'question');
    expect(state().hands).toHaveLength(2);
    expect(
      state().hands.every(
        (hand) => hand.cards.length === 2 && hand.splitAces && hand.complete,
      ),
    ).toBe(true);
    expect(state().hands[0].cards.map((card) => card.rank)).toEqual(['A', 'A']);
    disconnect();
  });
  it('hits multi-card soft hands and stands on soft 17 as the dealer', async () => {
    const soft = practice(['A', '10', '2', '7', '2', '4']);
    await soft.until(() => soft.state().phase === 'question');
    expect(soft.state().hands[0].cards.map((card) => card.rank)).toEqual([
      'A',
      '2',
      '2',
      '4',
    ]);
    expect(score(soft.state().hands[0].cards)).toMatchObject({
      total: 19,
      soft: true,
    });
    soft.disconnect();
    const dealer = practice(['10', 'A', '7', '6']);
    await dealer.until(() => dealer.state().phase === 'question');
    expect(dealer.state().dealer).toHaveLength(2);
    expect(score(dealer.state().dealer)).toMatchObject({
      total: 17,
      soft: true,
    });
    dealer.disconnect();
  });
  it('waits for the requested number of rounds, and mistakes wait for Continue', async () => {
    const { trainer, state, until, disconnect } = practice(
      ['10', 'A', '7', '6'],
      2,
    );
    await until(() => state().phase === 'question');
    expect(state().completedRounds).toBe(2);
    trainer.submitCount(state().runningCount + 1);
    expect(state().feedback?.correct).toBe(false);
    expect(state().stats).toMatchObject({
      attempts: 1,
      correct: 0,
      incorrect: 1,
      streak: 0,
    });
    const round = state().round;
    await vi.advanceTimersByTimeAsync(60000);
    expect(state().round).toBe(round);
    trainer.continuePractice();
    expect(state().round).toBe(round + 1);
    await until(() => state().phase === 'question');
    expect(state().completedRounds).toBe(4);
    disconnect();
  });
  it('pauses in menus, honors manual Pause, and applies only committed preferences', async () => {
    const { trainer, state, until, save, disconnect } = practice([
      '10',
      '6',
      '7',
      '2',
      '9',
    ]);
    await until(() => state().dealer.length === 1);
    trainer.openPanel('options');
    const held = state();
    trainer.updateOption('pace', 1);
    trainer.updateOption('askEvery', 4);
    await vi.advanceTimersByTimeAsync(60000);
    expect(state()).toEqual(held);
    trainer.closePanel();
    expect(trainer.getSnapshot().options).toEqual({
      test: 'running-count',
      pace: 10,
      askEvery: 1,
    });
    trainer.togglePause();
    const paused = state();
    await vi.advanceTimersByTimeAsync(60000);
    expect(state()).toEqual(paused);
    trainer.openPanel('options');
    trainer.updateOption('pace', 1);
    trainer.applySettings();
    trainer.closePanel();
    expect(save.mock.lastCall?.[0]).toEqual({
      test: 'running-count',
      pace: 1,
      askEvery: 1,
    });
    expect(state().paused).toBe(true);
    trainer.togglePause();
    await vi.advanceTimersByTimeAsync(1999);
    expect(state().hands[0].cards).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(26);
    expect(state().hands[0].cards).toHaveLength(2);
    disconnect();
  });
  it('keeps counts across rounds and announces a zero reset at the next shoe', async () => {
    const ranks: Rank[] = Array.from(
      { length: 4 },
      () => ['10', 'A', '7', '6'] as Rank[],
    ).flat();
    const { trainer, state, until, createShoe, disconnect } = practice(
      ranks,
      1,
      false,
    );
    for (let round = 1; round <= 3; round++) {
      await until(() => state().phase === 'question');
      expect(state().runningCount).toBe(-round);
      trainer.submitCount(-round);
      await vi.advanceTimersByTimeAsync(1100);
    }
    expect(createShoe).toHaveBeenCalledTimes(2);
    expect(state()).toMatchObject({
      shoeNumber: 2,
      runningCount: 0,
      completedRounds: 3,
      round: 4,
    });
    expect(state().message).toContain('Start the running count at 0');
    expect(state().hands[0].cards).toHaveLength(0);
    disconnect();
  });
  it('discards pending playback and starts with separate, empty stats on a new run', async () => {
    const { trainer, state, until, disconnect } = practice([
      '10',
      '6',
      '7',
      '2',
      '9',
    ]);
    await until(() => state().phase === 'question');
    trainer.submitCount(1);
    trainer.discardSession();
    await vi.advanceTimersByTimeAsync(60000);
    expect(state()).toMatchObject({
      started: false,
      panel: 'menu',
      phase: 'idle',
      runningCount: 0,
      stats: { modeId: 'running-count', attempts: 0 },
    });
    trainer.configure();
    trainer.start();
    expect(state().round).toBe(1);
    expect(state().runningCount).toBe(0);
    expect(state().stats.attempts).toBe(0);
    disconnect();
  });
});

it('validates independent count settings and orders the pace from slow to fast', () => {
  for (const value of [null, [], 'broken', { pace: Infinity, askEvery: '2' }])
    expect(parseCountOptions(value)).toEqual(DEFAULT_COUNT_OPTIONS);
  expect(parseCountOptions({ pace: -2, askEvery: 20 })).toEqual({
    test: 'running-count',
    pace: 1,
    askEvery: 10,
  });
  expect(
    paceDelay({ test: 'running-count', pace: 1, askEvery: 1 }),
  ).toBeGreaterThan(
    paceDelay({ test: 'running-count', pace: 10, askEvery: 1 }),
  );
});
