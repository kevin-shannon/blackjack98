import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlackjackGame } from './createBlackjackGame';
import { DEFAULT_OPTIONS, DEFAULT_RULES } from './constants';
import { hiLo, score } from './cards';
import type { Card, GameOptions, Rank, TableRules } from './types';
function scenario(
  sequence: Rank[],
  rules: Partial<TableRules> = {},
  options: Partial<GameOptions> = {},
) {
  const save = vi.fn();
  const completed = vi.fn();
  const game = createBlackjackGame({
    settings: {
      load: () => ({
        rules: { ...DEFAULT_RULES, ...rules },
        options: { ...DEFAULT_OPTIONS, ...options },
        chip: 25,
      }),
      save,
    },
    createShoe: () => [
      ...Array.from({ length: 200 }, (): Pick<Card, 'rank' | 'suit'> => ({
        rank: '7',
        suit: 'C',
      })),
      ...[...sequence].reverse().map((rank) => ({ rank, suit: 'S' as const })),
    ],
    onRoundComplete: completed,
  });
  game.configureFreePlay();
  game.startFreePlay();
  return { game, save, completed, state: () => game.getSnapshot().state };
}
async function finish(task: Promise<void>) {
  await vi.advanceTimersByTimeAsync(5000);
  await task;
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('card values', () => {
  it('reduces multiple aces without losing a soft total', () => {
    expect(score([{ rank: 'A' }, { rank: 'A' }, { rank: '9' }])).toEqual({
      total: 21,
      soft: true,
      blackjack: false,
    });
    expect(score([{ rank: 'A' }, { rank: '6' }, { rank: '10' }])).toEqual({
      total: 17,
      soft: false,
      blackjack: false,
    });
  });
  it('uses the original Hi-Lo system', () => {
    expect(
      ['2', '6', '7', '9', '10', 'A'].map((rank) =>
        hiLo({ rank: rank as Rank }),
      ),
    ).toEqual([1, 1, 0, 0, -1, -1]);
  });
});
describe('rounds and payouts', () => {
  it.each([
    ['3:2', 1037.5],
    ['6:5', 1030],
    ['1:1', 1025],
    ['2:1', 1050],
  ] as const)('pays a natural at %s', async (payout, expected) => {
    const { game, state, completed } = scenario(['A', '9', 'K', '8'], {
      payout,
    });
    await finish(game.deal());
    expect(state().phase).toBe('roundOver');
    expect(state().bankroll).toBe(expected);
    expect(state().wins).toBe(1);
    expect(completed).toHaveBeenCalledOnce();
    expect(completed.mock.calls[0][0]).toMatchObject({
      modeId: 'free-play',
      net: expected - 1000,
      results: ['BLACKJACK'],
    });
  });
  it('pushes a tie and does not count the hidden dealer card early', async () => {
    const { game, state } = scenario(['10', '10', '7', '7']);
    await finish(game.deal());
    expect(state().runningCount).toBe(-2);
    expect(state().seen.size).toBe(3);
    await finish(game.act('stand'));
    expect(state().bankroll).toBe(1000);
    expect(state().pushes).toBe(1);
    expect(state().seen.size).toBe(4);
  });
  it('pays insurance against dealer blackjack', async () => {
    const { game, state } = scenario(['10', 'A', '9', 'K']);
    await finish(game.deal());
    expect(state().phase).toBe('insurance');
    await finish(game.insure(true));
    expect(state().bankroll).toBe(1000);
    expect(state().insuranceBet).toBe(12.5);
    expect(state().losses).toBe(1);
  });
  it('returns both natural wagers when the dealer also has blackjack', async () => {
    const { game, state } = scenario(['A', 'A', 'K', 'K']);
    await finish(game.deal());
    await finish(game.insure(false));
    expect(state().bankroll).toBe(1000);
    expect(state().hands[0].result).toBe('PUSH');
  });
  it('doubles the stake and deals exactly one additional card', async () => {
    const { game, state } = scenario(['5', '10', '6', '7', '10']);
    await finish(game.deal());
    await finish(game.act('double'));
    expect(state().hands[0]).toMatchObject({
      doubled: true,
      bet: 50,
      result: 'WIN',
    });
    expect(state().hands[0].cards).toHaveLength(3);
    expect(state().bankroll).toBe(1050);
  });
  it('returns half the initial stake on late surrender', async () => {
    const { game, state } = scenario(['10', '10', '6', '7'], {
      surrender: true,
    });
    await finish(game.deal());
    await finish(game.act('surrender'));
    expect(state().bankroll).toBe(987.5);
    expect(state().hands[0].result).toBe('SURRENDER');
  });
  it.each([false, true])('respects hit soft 17 = %s', async (hitSoft17) => {
    const { game, state } = scenario(['10', '6', '8', 'A', '2'], { hitSoft17 });
    await finish(game.deal());
    await finish(game.act('stand'));
    expect(state().dealer).toHaveLength(hitSoft17 ? 3 : 2);
    expect(state().bankroll).toBe(hitSoft17 ? 975 : 1025);
  });
  it('settles a bust as a loss', async () => {
    const { game, state } = scenario(['10', '10', '6', '7', 'K']);
    await finish(game.deal());
    await finish(game.act('hit'));
    expect(state().hands[0].result).toBe('BUST');
    expect(state().bankroll).toBe(975);
  });
});
describe('splitting and cancellation', () => {
  it('plays split aces normally and pays split 21 as a regular win', async () => {
    const { game, state } = scenario(['A', '10', 'A', '7', 'K', '9']);
    await finish(game.deal());
    await finish(game.act('split'));
    expect(state().hands).toHaveLength(2);
    expect(state().hands[0].complete).toBe(false);
    await finish(game.act('stand'));
    await finish(game.act('stand'));
    expect(state().hands.map((hand) => hand.result)).toEqual(['WIN', 'WIN']);
    expect(state().bankroll).toBe(1050);
  });
  it('allows resplitting aces only when configured', async () => {
    for (const resplitAces of [false, true]) {
      const { game, state } = scenario(['A', '10', 'A', '7', 'A', '9'], {
        resplitAces,
      });
      await finish(game.deal());
      await finish(game.act('split'));
      expect(game.canSplit(state().hands[0])).toBe(resplitAces);
    }
  });
  it('enforces double after split', async () => {
    const { game, state } = scenario(['8', '10', '8', '7', '3', '2'], {
      doubleAfterSplit: false,
    });
    await finish(game.deal());
    await finish(game.act('split'));
    expect(game.canDouble(state().hands[0])).toBe(false);
    await finish(game.act('double'));
    expect(state().bankroll).toBe(950);
  });
  it('refunds every split and doubled stake when rules change', async () => {
    const { game, state } = scenario(['8', '10', '8', '7', '3', '2', '10']);
    await finish(game.deal());
    await finish(game.act('split'));
    await finish(game.act('double'));
    expect(state().bankroll).toBe(925);
    game.openPanel('rules');
    game.updateRule('decks', 2);
    expect(state()).toMatchObject({
      bankroll: 1000,
      phase: 'betting',
      hands: [],
      sessionNet: 0,
    });
  });
  it('cancels an in-flight deal without applying stale cards after a reset', async () => {
    const { game, state } = scenario(['10', '10', '8', '7']);
    const pending = game.deal();
    game.resetSession();
    await finish(pending);
    expect(state()).toMatchObject({
      bankroll: 1000,
      phase: 'betting',
      hands: [],
      dealer: [],
      busy: false,
    });
  });
  it('rejects simultaneous player actions while a card is being dealt', async () => {
    const { game, state } = scenario(['5', '10', '6', '7', '2']);
    await finish(game.deal());
    const pending = game.act('hit');
    await game.act('double');
    await finish(pending);
    expect(state().hands[0].cards).toHaveLength(3);
    expect(state().hands[0].doubled).toBe(false);
    expect(state().bankroll).toBe(975);
  });
});
describe('training options and settings', () => {
  it.each([
    ['small-fry', 500, 5, 250],
    ['average-joe', 2500, 25, 1000],
    ['high-roller', 10000, 100, 5000],
  ] as const)(
    'applies %s stakes and enforces its limits in a new session',
    (stakes, bankroll, minBet, maxBet) => {
      const { game, state } = scenario([]);
      game.openPanel('options');
      game.updateOption('stakes', stakes);
      expect(state().bankroll).toBe(1000);
      expect(state().maxBet).toBe(500);
      game.resetSession();
      expect(state()).toMatchObject({ bankroll, minBet, maxBet });
      game.setBet(0);
      expect(state().bet).toBe(minBet);
      game.setBet(100000);
      expect(state().bet).toBe(Math.min(bankroll, maxBet));
    },
  );
  it('adjusts conflicting custom limits and retains them when restarting', () => {
    const { game, state } = scenario([]);
    game.openPanel('options');
    game.updateOption('maxBet', 100);
    game.updateOption('startingBankroll', 100);
    game.updateOption('minBet', 1000);
    expect(game.getSnapshot().options).toMatchObject({
      stakes: 'custom',
      minBet: 1000,
      maxBet: 1000,
      startingBankroll: 1000,
    });
    game.updateOption('startingBankroll', 750);
    expect(game.getSnapshot().options.minBet).toBe(500);
    game.updateOption('maxBet', 100);
    expect(game.getSnapshot().options.minBet).toBe(100);
    game.resetSession();
    expect(state()).toMatchObject({ bankroll: 750, minBet: 100, maxBet: 100 });
  });
  it('blocks dealing when the remaining bankroll is below the selected table minimum', async () => {
    const { game, state } = scenario(
      ['10', '10', '6', '7', 'K'],
      {},
      { startingBankroll: 100, minBet: 100, maxBet: 100 },
    );
    await finish(game.deal());
    await finish(game.act('hit'));
    expect(state().bankroll).toBe(0);
    expect(state().bet).toBe(0);
    await game.deal();
    expect(state().round).toBe(1);
  });
  it('pauses the decision timer while menus are open, then automatically stands', async () => {
    const { game, state } = scenario(
      ['10', '10', '8', '7'],
      {},
      { timedHands: true, seconds: 3 },
    );
    const disconnect = game.connect();
    const dealing = game.deal();
    await vi.advanceTimersByTimeAsync(800);
    await dealing;
    game.openPanel('help');
    await vi.advanceTimersByTimeAsync(10000);
    expect(state().phase).toBe('playing');
    game.closePanel();
    await vi.advanceTimersByTimeAsync(4000);
    expect(state().phase).toBe('roundOver');
    disconnect();
  });
  it('continues tracking the running count between rounds without interrupting play', async () => {
    const { game, state } = scenario(['10', '10', '8', '7']);
    await finish(game.deal());
    expect(state().runningCount).toBe(-2);
    await finish(game.act('stand'));
    expect(state().phase).toBe('roundOver');
    expect(state().runningCount).toBe(-2);
    await finish(game.deal());
    expect(state().phase).toBe('playing');
    expect(state().round).toBe(2);
    game.resetSession();
    expect(state().runningCount).toBe(0);
  });
  it('does not save setup drafts until the mode is started', () => {
    const { game, save } = scenario([]);
    save.mockClear();
    game.openPanel('menu');
    game.configureFreePlay();
    game.updateRule('decks', 2);
    game.backToMenu();
    expect(game.getSnapshot().rules.decks).toBe(6);
    expect(save).not.toHaveBeenCalled();
  });
  it('selects a denomination separately from changing the wager', () => {
    const { game, state } = scenario([]);
    game.selectChip(100);
    expect(state().bet).toBe(25);
    game.setBet(state().bet + game.getSnapshot().selectedChip);
    expect(state().bet).toBe(125);
    game.setBet(9999);
    expect(state().bet).toBe(500);
    game.setBet(0);
    expect(state().bet).toBe(5);
  });
  it('publishes stable immutable snapshots to subscribers', () => {
    const { game } = scenario([]);
    const previous = game.getSnapshot();
    const listener = vi.fn();
    const unsubscribe = game.subscribe(listener);
    expect(game.getSnapshot()).toBe(previous);
    game.setBet(50);
    expect(previous.state.bet).toBe(25);
    expect(game.getSnapshot().state.bet).toBe(50);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    game.setBet(75);
    expect(listener).toHaveBeenCalledOnce();
  });
});
