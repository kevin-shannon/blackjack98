import {
  createFreePlayStats,
  recordFreePlayRound,
} from '../../stats/sessionStats';
import {
  DEAL_DELAY as DELAY,
  MAX_HANDS,
  RANKS,
  SUIT_SYMBOL,
  CHIPS,
} from './constants';
import { clamp, hiLo, natural, score, value } from './cards';
import type {
  Card,
  GameOptions,
  GameSnapshot,
  GameState,
  Hand,
  HandResult,
  Panel,
  PlayerAction,
  Suit,
  TableRules,
} from './types';
import { browserSettingsRepository } from '../../settings/settingsRepository';
import type { SettingsRepository } from '../../settings/settingsRepository';
import { money } from '../../../shared/lib/format';
import { normalizeStakes } from '../../settings/stakes';
export interface GameDependencies {
  settings?: SettingsRepository;
  random?: () => number;
  /** Optional shoe factory for reproducible practice scenarios and tests. Last card is dealt first. */
  createShoe?: (rules: TableRules) => Pick<Card, 'rank' | 'suit'>[];
  onRoundComplete?: (round: RoundCompleted) => void;
}
export interface RoundCompleted {
  modeId: 'free-play';
  round: number;
  net: number;
  bankroll: number;
  results: HandResult[];
  rules: TableRules;
}
/** A DOM-free controller. React observes immutable snapshots, not the mutable round internals. */
export function createBlackjackGame(dependencies: GameDependencies = {}) {
  const repository = dependencies.settings ?? browserSettingsRepository;
  const random = dependencies.random ?? Math.random;
  const persisted = repository.load();
  let rules = { ...persisted.rules },
    options = { ...persisted.options };
  let selectedChip = persisted.chip;
  let shoe: Pick<Card, 'rank' | 'suit'>[] = [],
    shoeDecks = 0,
    cardId = 0,
    roundRules = { ...rules };
  let draftRules: TableRules | null = null,
    draftOptions: GameOptions | null = null;
  let timerDeadline = 0,
    timerRemaining = 0;
  let roundEpoch = 0;
  const CANCELED_ROUND = Symbol('canceled round');
  const wait = async (ms: number) => {
    const epoch = roundEpoch;
    await new Promise((resolve) => setTimeout(resolve, ms));
    if (epoch !== roundEpoch) throw CANCELED_ROUND;
  };
  const listeners = new Set<() => void>();
  let snapshot: GameSnapshot;
  function render() {
    snapshot = {
      state: structuredClone(state),
      rules: { ...rules },
      roundRules: { ...roundRules },
      options: { ...options },
      selectedChip,
      draftRules: draftRules && { ...draftRules },
      draftOptions: draftOptions && { ...draftOptions },
      shoeRemaining: shoe.length,
      shoeTotal: shoeDecks * 52,
      timerSeconds:
        activeTimer() && (timerDeadline || timerRemaining)
          ? Math.max(
              0,
              Math.ceil(
                (state.panel ? timerRemaining : timerDeadline - Date.now()) /
                  1000,
              ),
            )
          : null,
    };
    listeners.forEach((listener) => listener());
  }
  function saveSettings() {
    repository.save({ rules, options, chip: selectedChip });
  }
  const state: GameState = {
    stats: createFreePlayStats(),
    minBet: options.minBet,
    maxBet: options.maxBet,
    bankroll: options.startingBankroll,
    bet: 25,
    phase: 'betting',
    busy: false,
    modeStarted: false,
    panel: 'menu',
    dealer: [],
    dealerRevealed: false,
    hands: [],
    active: 0,
    insuranceBet: 0,
    round: 1,
    roundStartBankroll: options.startingBankroll,
    lastDealtId: null,
    message: 'Choose your wager to begin.',
    netResult: 0,
    runningCount: 0,
    seen: new Set(),
  };
  function expose(card: Card) {
    if (card && !state.seen.has(card.id)) {
      state.seen.add(card.id);
      state.runningCount += hiLo(card);
    }
  }
  function revealDealer() {
    if (!state.dealerRevealed) {
      state.dealerRevealed = true;
      state.dealer.forEach(expose);
    }
  }
  function makeShoe() {
    shoe = [];
    for (let d = 0; d < rules.decks; d++)
      for (const suit of Object.keys(SUIT_SYMBOL) as Suit[])
        for (const rank of RANKS) shoe.push({ suit, rank });
    for (let i = shoe.length - 1; i > 0; i--) {
      let j = Math.floor(random() * (i + 1));
      [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
    }
    if (dependencies.createShoe) shoe = dependencies.createShoe({ ...rules });
    shoeDecks = rules.decks;
    state.runningCount = 0;
    state.seen.clear();
  }
  function needsShuffle() {
    return (
      shoeDecks !== rules.decks ||
      !shoe.length ||
      shoe.length <=
        Math.floor((52 * rules.decks * (100 - rules.penetration)) / 100)
    );
  }
  function draw() {
    if (!shoe.length) makeShoe();
    return { ...shoe.pop()!, id: ++cardId };
  }
  function canBet() {
    return (
      state.modeStarted &&
      (state.phase === 'betting' || state.phase === 'roundOver') &&
      !state.busy
    );
  }
  function currentHand(): Hand | undefined {
    return state.hands[state.active];
  }
  function canSplit(h: Hand | undefined) {
    if (
      !h ||
      h.cards.length !== 2 ||
      state.hands.length >= MAX_HANDS ||
      state.bankroll < h.bet
    )
      return false;
    if (value(h.cards[0]) !== value(h.cards[1])) return false;
    // Re-splitting Aces is separately configurable; split Ace hands may otherwise play normally.
    if (h.splitAces)
      return (
        roundRules.resplitAces &&
        h.cards[0].rank === 'A' &&
        h.cards[1].rank === 'A'
      );
    return true;
  }
  function canDouble(h: Hand | undefined) {
    return (
      !!h &&
      h.cards.length === 2 &&
      (!h.fromSplit || roundRules.doubleAfterSplit) &&
      state.bankroll >= h.bet
    );
  }
  function canHit(h: Hand | undefined) {
    return !!h && score(h.cards).total < 21;
  }
  function canSurrender(h: Hand | undefined) {
    return (
      !!h &&
      roundRules.surrender &&
      !h.fromSplit &&
      h.cards.length === 2 &&
      state.hands.length === 1
    );
  }
  function normalizeBet(amount: number | string) {
    if (state.bankroll < state.minBet) return 0;
    const limit = Math.min(state.maxBet, Math.floor(state.bankroll / 5) * 5);
    const n = Number.isFinite(Number(amount)) ? Number(amount) : state.bet;
    return clamp(Math.round(n / 5) * 5, state.minBet, limit);
  }
  function setBet(n: number | string) {
    if (!canBet()) return;
    state.bet = normalizeBet(n);
    render();
  }
  function activeTimer() {
    return options.timedHands && state.phase === 'playing' && state.modeStarted;
  }
  function pauseTimer() {
    if (timerDeadline) {
      timerRemaining = Math.max(0, timerDeadline - Date.now());
      timerDeadline = 0;
    }
  }
  function resumeTimer() {
    if (!timerDeadline && timerRemaining > 0 && activeTimer())
      timerDeadline = Date.now() + timerRemaining;
  }
  function stopTimer() {
    timerDeadline = 0;
    timerRemaining = 0;
  }
  function startTimer() {
    stopTimer();
    if (activeTimer()) {
      timerRemaining = options.seconds * 1000;
      if (!state.panel) timerDeadline = Date.now() + timerRemaining;
    }
  }
  function tick() {
    if (state.panel || !activeTimer() || !timerDeadline) return;
    if (Date.now() >= timerDeadline && !state.busy) {
      stopTimer();
      state.message = 'Time expired — automatic stand.';
      runRoundTask(act('stand'));
    } else render();
  }
  async function runRoundTask(promise: Promise<void>) {
    try {
      await promise;
    } catch (error) {
      if (error !== CANCELED_ROUND) throw error;
    }
  }
  async function dealTo(who: 'dealer' | 'player', index = 0) {
    const c = draw();
    if (who === 'dealer') {
      state.dealer.push(c);
      if (state.dealerRevealed || state.dealer.length === 1) expose(c);
    } else {
      state.hands[index].cards.push(c);
      expose(c);
    }
    state.lastDealtId = c.id;
    render();
    await wait(DELAY);
    state.lastDealtId = null;
  }
  async function startRound() {
    if (!canBet() || state.bankroll < state.minBet || state.panel) return;
    if (state.phase === 'roundOver') state.round++;
    if (needsShuffle()) makeShoe();
    roundRules = { ...rules };
    state.bet = normalizeBet(state.bet);
    state.roundStartBankroll = state.bankroll;
    state.bankroll -= state.bet;
    state.dealer = [];
    state.dealerRevealed = false;
    state.insuranceBet = 0;
    state.hands = [newHand([], state.bet, false, false)];
    state.active = 0;
    state.phase = 'dealing';
    state.busy = true;
    state.message = 'Dealing cards…';
    state.netResult = 0;
    render();
    await dealTo('player');
    await dealTo('dealer');
    await dealTo('player');
    await dealTo('dealer');
    if (state.dealer[0].rank === 'A') {
      state.phase = 'insurance';
      state.busy = false;
      state.message = 'Dealer shows an Ace. Insurance?';
      render();
    } else await peekAndContinue();
  }
  function newHand(
    cards: Card[],
    bet: number,
    fromSplit: boolean,
    splitAces: boolean,
  ): Hand {
    return {
      cards,
      bet,
      complete: false,
      status: '',
      result: '',
      payout: 0,
      fromSplit,
      splitAces,
      doubled: false,
    };
  }
  async function decideInsurance(accept: boolean) {
    if (state.phase !== 'insurance' || state.busy) return;
    state.busy = true;
    if (accept && state.bankroll >= state.bet / 2) {
      state.insuranceBet = state.bet / 2;
      state.bankroll -= state.insuranceBet;
    }
    state.phase = 'dealing';
    state.message = 'Dealer checks for blackjack…';
    render();
    await wait(180);
    await peekAndContinue();
  }
  async function peekAndContinue() {
    if (score(state.dealer).blackjack) {
      revealDealer();
      state.message = 'Dealer has blackjack.';
      render();
      await wait(280);
      settle();
      return;
    }
    if (natural(state.hands[0])) {
      revealDealer();
      state.message = 'Natural blackjack!';
      render();
      await wait(280);
      settle();
      return;
    }
    state.phase = 'playing';
    state.busy = false;
    state.message = 'Your move. Hit, stand, double, or split.';
    startTimer();
    render();
  }
  async function act(action: PlayerAction) {
    if (state.phase !== 'playing' || state.busy || state.panel) return;
    const h = currentHand();
    if (!h || h.complete) return;
    if (
      (action === 'double' && !canDouble(h)) ||
      (action === 'split' && !canSplit(h)) ||
      (action === 'surrender' && !canSurrender(h)) ||
      (action === 'hit' && !canHit(h))
    )
      return;
    state.busy = true;
    if (action === 'hit') {
      state.message = 'You hit.';
      await dealTo('player', state.active);
      const pts = score(h.cards).total;
      if (pts >= 21) {
        h.complete = true;
        h.status = pts > 21 ? 'bust' : 'stand';
      }
    } else if (action === 'stand') {
      h.complete = true;
      h.status = 'stand';
      state.message = 'You stand.';
    } else if (action === 'double') {
      state.bankroll -= h.bet;
      h.bet *= 2;
      h.doubled = true;
      state.message = 'Double down. One card only.';
      await dealTo('player', state.active);
      h.complete = true;
      h.status = score(h.cards).total > 21 ? 'bust' : 'stand';
    } else if (action === 'surrender') {
      h.complete = true;
      h.status = 'surrender';
      state.message = 'You surrender half your wager.';
    } else if (action === 'split') {
      state.bankroll -= h.bet;
      const moving = h.cards.pop()!,
        isAces = h.cards[0].rank === 'A';
      const sister = newHand([moving], h.bet, true, isAces || h.splitAces);
      h.fromSplit = true;
      h.splitAces = isAces || h.splitAces;
      state.hands.splice(state.active + 1, 0, sister);
      state.message = h.splitAces
        ? 'Aces split. Play each hand normally.'
        : 'Pair split. Playing first hand.';
      render();
      await wait(110);
      await dealTo('player', state.active);
      await dealTo('player', state.active + 1);
      // Split Ace hands remain active after receiving their second cards.
      // The Resplit Aces option controls only whether another pair of Aces may split.
      startTimer();
    }
    if (h.complete) {
      stopTimer();
      await advance();
      return;
    }
    state.busy = false;
    if (action === 'hit') startTimer();
    render();
  }
  async function advance() {
    const next = state.hands.findIndex(
      (h, i) => i > state.active && !h.complete,
    );
    if (next >= 0) {
      state.active = next;
      state.busy = false;
      state.message = `Playing hand ${next + 1} of ${state.hands.length}.`;
      startTimer();
      render();
      return;
    }
    await dealerTurn();
  }
  async function dealerTurn() {
    stopTimer();
    state.phase = 'dealerTurn';
    state.busy = true;
    revealDealer();
    state.message = 'Dealer reveals the hole card.';
    render();
    await wait(280);
    if (
      state.hands.some(
        (h) => h.status !== 'surrender' && score(h.cards).total <= 21,
      )
    ) {
      while (true) {
        const d = score(state.dealer);
        if (
          d.total > 17 ||
          (d.total === 17 && (!d.soft || !roundRules.hitSoft17))
        )
          break;
        state.message = 'Dealer hits.';
        await dealTo('dealer');
        await wait(70);
      }
    }
    settle();
  }
  function payoutMultiplier() {
    return (
      { '3:2': 2.5, '6:5': 2.2, '1:1': 2, '2:1': 3 }[roundRules.payout] || 2.5
    );
  }
  function settle() {
    stopTimer();
    const dealerScore = score(state.dealer),
      dealerNatural = dealerScore.blackjack;
    if (state.insuranceBet > 0 && dealerNatural)
      state.bankroll += state.insuranceBet * 3;
    const all: HandResult[] = [];
    for (const h of state.hands) {
      const points = score(h.cards).total;
      let payout = 0;
      let result: HandResult = 'LOSE';
      if (h.status === 'surrender') {
        result = 'SURRENDER';
        payout = h.bet / 2;
      } else if (points > 21) result = 'BUST';
      else if (dealerNatural) {
        if (natural(h)) {
          result = 'PUSH';
          payout = h.bet;
        }
      } else if (natural(h)) {
        result = 'BLACKJACK';
        payout = h.bet * payoutMultiplier();
      } else if (dealerScore.total > 21 || points > dealerScore.total) {
        result = 'WIN';
        payout = h.bet * 2;
      } else if (points === dealerScore.total) {
        result = 'PUSH';
        payout = h.bet;
      }
      h.result = result;
      h.payout = payout;
      h.complete = true;
      state.bankroll += payout;
      all.push(result);
    }
    state.netResult = state.bankroll - state.roundStartBankroll;
    state.stats = recordFreePlayRound(state.stats, all, state.netResult);
    revealDealer();
    state.phase = 'roundOver';
    state.busy = false;
    if (all.length === 1) {
      const desc = {
        BLACKJACK: `Blackjack! Paid ${roundRules.payout}.`,
        WIN: 'You win this hand.',
        PUSH: 'Push. Your wager is returned.',
        LOSE: 'Dealer wins this hand.',
        BUST: 'You busted.',
        SURRENDER: 'Surrender. Half your wager returned.',
      };
      state.message = desc[all[0]];
    } else
      state.message = `${all.filter((r) => ['WIN', 'BLACKJACK'].includes(r)).length} won · ${all.filter((r) => r === 'PUSH').length} pushed · ${all.filter((r) => ['LOSE', 'BUST', 'SURRENDER'].includes(r)).length} lost`;
    state.message +=
      '  ' +
      (state.netResult > 0
        ? '+' + money(state.netResult)
        : state.netResult < 0
          ? '-' + money(-state.netResult)
          : 'Break even');
    if (state.bankroll < state.minBet) state.bet = 0;
    else state.bet = normalizeBet(state.bet || 25);
    render();
    dependencies.onRoundComplete?.({
      modeId: 'free-play',
      round: state.round,
      net: state.netResult,
      bankroll: state.bankroll,
      results: [...all],
      rules: { ...roundRules },
    });
  }
  function resetSession() {
    initializeSession(true);
  }
  function discardSession() {
    draftRules = null;
    draftOptions = null;
    initializeSession(false);
  }
  function initializeSession(started: boolean) {
    state.stats = createFreePlayStats();
    roundEpoch++;
    stopTimer();
    state.bankroll = options.startingBankroll;
    state.minBet = options.minBet;
    state.maxBet = options.maxBet;
    state.bet = normalizeBet(25);
    state.phase = 'betting';
    state.busy = false;
    state.dealer = [];
    state.dealerRevealed = false;
    state.hands = [];
    state.active = 0;
    state.insuranceBet = 0;
    state.round = 1;
    state.roundStartBankroll = options.startingBankroll;
    state.lastDealtId = null;
    state.message = 'Choose your wager to begin.';
    state.netResult = 0;
    state.panel = started ? null : 'menu';
    state.modeStarted = started;
    if (started) makeShoe();
    else {
      shoe = [];
      shoeDecks = 0;
      state.runningCount = 0;
      state.seen.clear();
    }
    render();
  }
  function cancelRoundForRuleChange() {
    // Only an unsettled hand can be voided. Split, doubled and insurance stakes
    // are all included in the pre-round bankroll, so refunds are exact.
    if (
      !['dealing', 'insurance', 'playing', 'dealerTurn'].includes(state.phase)
    )
      return false;
    roundEpoch++;
    stopTimer();
    state.bankroll = state.roundStartBankroll;
    state.dealer = [];
    state.dealerRevealed = false;
    state.hands = [];
    state.active = 0;
    state.insuranceBet = 0;
    state.lastDealtId = null;
    state.busy = false;
    state.phase = 'betting';
    state.netResult = 0;
    state.bet = normalizeBet(state.bet);
    state.message = 'Rules changed. Round canceled and all wagers refunded.';
    return true;
  }
  function openPanel(name: Exclude<Panel, null>) {
    if (state.phase === 'insurance') return;
    if (state.panel === name) return;
    pauseTimer();
    state.panel = name;
    render();
  }
  function closePanel() {
    if (!state.modeStarted) {
      backToMenu();
      return;
    }
    state.panel = null;
    resumeTimer();
    render();
  }
  function configureFreePlay() {
    draftRules = { ...rules };
    draftOptions = { ...options };
    state.panel = 'setup';
    render();
  }
  function backToMenu() {
    draftRules = null;
    draftOptions = null;
    state.panel = 'menu';
    render();
  }
  function startFreePlay() {
    if (!draftRules || !draftOptions) return;
    rules = { ...draftRules };
    options = { ...draftOptions };
    draftRules = null;
    draftOptions = null;
    saveSettings();
    resetSession();
  }
  function updateRule<K extends keyof TableRules>(
    key: K,
    nextValue: TableRules[K],
  ) {
    const inSetup = state.panel === 'setup';
    const object = inSetup ? draftRules : rules;
    if (!object || object[key] === nextValue) return;
    object[key] = nextValue;
    if (!inSetup) {
      cancelRoundForRuleChange();
      makeShoe();
      saveSettings();
    }
    render();
  }
  function updateOption<K extends keyof GameOptions>(
    key: K,
    nextValue: GameOptions[K],
  ) {
    const inSetup = state.panel === 'setup';
    const object = inSetup ? draftOptions : options;
    if (!object || object[key] === nextValue) return;
    object[key] = nextValue;
    if (
      key === 'stakes' ||
      key === 'startingBankroll' ||
      key === 'minBet' ||
      key === 'maxBet'
    ) {
      Object.assign(
        object,
        normalizeStakes(object, key === 'stakes' ? undefined : key),
      );
    }
    if (!inSetup) {
      if (
        (key === 'timedHands' || key === 'seconds') &&
        state.phase === 'playing' &&
        !state.busy
      ) {
        if (options.timedHands) startTimer();
        else stopTimer();
      }
      saveSettings();
    }
    render();
  }
  function selectChip(chip: number) {
    if (!CHIPS.some((n) => n === chip)) return;
    selectedChip = chip;
    saveSettings();
    render();
  }
  makeShoe();
  render();
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    // Lifecycle is explicit: the React provider owns intervals and cancellation, including Strict Mode remounts.
    connect: () => {
      const interval = setInterval(tick, 200);
      return () => {
        clearInterval(interval);
        roundEpoch++;
      };
    },
    deal: () => runRoundTask(startRound()),
    act: (action: PlayerAction) => runRoundTask(act(action)),
    insure: (accept: boolean) => runRoundTask(decideInsurance(accept)),
    setBet,
    selectChip,
    openPanel,
    closePanel,
    configureFreePlay,
    backToMenu,
    startFreePlay,
    resetSession,
    discardSession,
    updateRule,
    updateOption,
    canBet,
    canDouble,
    canHit,
    canSplit,
    canSurrender,
  };
}
export type BlackjackGame = ReturnType<typeof createBlackjackGame>;
