import { RANKS } from '../../blackjack/model/constants';
import { hiLo, score } from '../../blackjack/model/cards';
import type {
  Card,
  Hand,
  Rank,
  Suit,
  PlayerAction,
} from '../../blackjack/model/types';
import { recommendAction } from '../../basic-strategy/model/strategy';
import type { RunningCountStats } from '../../stats/sessionStats';
import { createCountStats, recordCountAnswer } from './stats';
import {
  countSettingsRepository,
  paceDelay,
  parseCountOptions,
} from './settings';
import type { CountSettingsRepository, RunningCountOptions } from './settings';
import { createCountQuestion, validCountAnswer } from './questions';
import type { CountDrillQuestion } from './questions';

export type CountPanel =
  'menu' | 'setup' | 'rules' | 'options' | 'reset' | 'help' | null;
export interface RunningCountState {
  started: boolean;
  panel: CountPanel;
  phase: 'idle' | 'playing' | 'question' | 'feedback';
  paused: boolean;
  round: number;
  completedRounds: number;
  roundsSinceCheck: number;
  shoeNumber: number;
  dealer: Card[];
  dealerRevealed: boolean;
  hands: Hand[];
  activeHand: number;
  lastDealtId: number | null;
  message: string;
  runningCount: number;
  question: CountDrillQuestion | null;
  feedback: { answer: number; expected: number; correct: boolean } | null;
  stats: RunningCountStats;
}
export interface RunningCountSnapshot {
  state: RunningCountState;
  options: RunningCountOptions;
  draft: RunningCountOptions | null;
  shoeRemaining: number;
  shoeTotal: number;
}
type Stage =
  | 'new-round'
  | 'opening'
  | 'initial-action'
  | 'player'
  | 'split-draw'
  | 'reveal'
  | 'dealer'
  | 'finish'
  | 'check';
const RULES = { doubleAfterSplit: true, hitSoft17: false, surrender: false };
const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const emptyHand = (fromSplit = false, splitAces = false): Hand => ({
  cards: [],
  bet: 0,
  complete: false,
  status: '',
  result: '',
  payout: 0,
  fromSplit,
  splitAces,
  doubled: false,
});
const initialState = (): RunningCountState => ({
  started: false,
  panel: 'setup',
  phase: 'idle',
  paused: false,
  round: 0,
  completedRounds: 0,
  roundsSinceCheck: 0,
  shoeNumber: 0,
  dealer: [],
  dealerRevealed: false,
  hands: [],
  activeHand: 0,
  lastDealtId: null,
  message: 'Keep a Hi-Lo running count of the exposed cards.',
  runningCount: 0,
  question: null,
  feedback: null,
  stats: createCountStats(),
});

/** A paced, pausable blackjack observer. No wagering or player decisions are required. */
export function createRunningCountTrainer(
  dependencies: {
    random?: () => number;
    settings?: CountSettingsRepository;
    /** First entry is dealt first; production always uses a shuffled six-deck shoe. */
    createShoe?: () => Pick<Card, 'rank' | 'suit'>[];
  } = {},
) {
  const random = dependencies.random ?? Math.random;
  const repository = dependencies.settings ?? countSettingsRepository;
  let options = parseCountOptions(repository.load());
  let draft: RunningCountOptions | null = null;
  let state = initialState();
  let active = false,
    deadline = 0,
    remaining = 0,
    cardId = 0;
  let shoe: Pick<Card, 'rank' | 'suit'>[] = [],
    shoeTotal = 0;
  let stage: Stage = 'new-round',
    opening = 0;
  let splitDraws: number[] = [];
  const seen = new Set<number>();
  const listeners = new Set<() => void>();
  let snapshot: RunningCountSnapshot;
  function publish() {
    snapshot = {
      state: structuredClone(state),
      options: { ...options },
      draft: draft && { ...draft },
      shoeRemaining: shoe.length,
      shoeTotal,
    };
    listeners.forEach((listener) => listener());
  }
  function canRun() {
    return (
      active &&
      state.started &&
      !state.panel &&
      !state.paused &&
      (state.phase === 'playing' ||
        (state.phase === 'feedback' && state.feedback?.correct))
    );
  }
  function pauseClock() {
    if (deadline) remaining = Math.max(0, deadline - Date.now());
    deadline = 0;
  }
  function resumeClock() {
    if (canRun()) deadline = Date.now() + remaining;
  }
  function schedule(ms: number = paceDelay(options)) {
    remaining = ms;
    deadline = 0;
    resumeClock();
  }
  function expose(card: Card) {
    if (!seen.has(card.id)) {
      seen.add(card.id);
      state.runningCount += hiLo(card);
    }
  }
  function shuffle() {
    shoe = [];
    for (let deck = 0; deck < 6; deck++)
      for (const suit of SUITS)
        for (const rank of RANKS) shoe.push({ rank, suit });
    for (let index = shoe.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [shoe[index], shoe[other]] = [shoe[other], shoe[index]];
    }
    if (dependencies.createShoe)
      shoe = [...dependencies.createShoe()].reverse();
    if (shoe.length < 4)
      throw new Error('A practice shoe needs at least four cards.');
    shoeTotal = shoe.length;
    state.runningCount = 0;
    state.shoeNumber++;
    seen.clear();
  }
  function draw(hidden = false): Card {
    // A six-deck shoe is replaced between rounds with a generous reserve.
    if (!shoe.length)
      throw new Error('Practice shoe exhausted during a round.');
    const card = { ...shoe.pop()!, id: ++cardId };
    if (!hidden) expose(card);
    state.lastDealtId = card.id;
    return card;
  }
  function beginRound() {
    const newShoe =
      !shoe.length || shoe.length <= Math.max(4, Math.floor(shoeTotal * 0.25));
    if (newShoe) shuffle();
    state.round++;
    state.dealer = [];
    state.dealerRevealed = false;
    state.hands = [emptyHand()];
    state.activeHand = 0;
    state.lastDealtId = null;
    state.feedback = null;
    state.phase = 'playing';
    state.message = newShoe
      ? 'New shoe. Start the running count at 0.'
      : 'Dealing the next round.';
    opening = 0;
    splitDraws = [];
    stage = 'opening';
    schedule(newShoe ? Math.max(1500, paceDelay(options)) : paceDelay(options));
  }
  function beginPractice() {
    if (options.test === 'running-count') {
      beginRound();
      return;
    }
    deadline = 0;
    state.round++;
    state.phase = 'question';
    state.feedback = null;
    state.question = createCountQuestion(options.test, random);
    state.message =
      options.test === 'deck-estimation'
        ? 'Estimate the decks remaining.'
        : 'Divide running count by decks remaining.';
  }
  function playerAction(hand: Hand): PlayerAction {
    const result = score(hand.cards);
    let cards: [Card, Card];
    if (hand.cards.length === 2) cards = [hand.cards[0], hand.cards[1]];
    else if (result.soft)
      cards = [
        { rank: 'A', suit: 'S', id: 0 },
        { rank: String(result.total - 11) as Rank, suit: 'S', id: 0 },
      ];
    else cards = hardCards(result.total);
    let action = recommendAction(cards, state.dealer[0], RULES);
    if (action === 'split' && state.hands.length >= 4)
      action =
        result.total === 4
          ? 'hit'
          : recommendAction(hardCards(result.total), state.dealer[0], RULES);
    if (action === 'double' && hand.cards.length !== 2) action = 'hit';
    return action;
  }
  function hardCards(total: number): [Card, Card] {
    const first = total > 12 ? total - 10 : 2;
    return [
      { rank: String(first) as Rank, suit: 'S', id: 0 },
      { rank: String(total - first) as Rank, suit: 'S', id: 0 },
    ];
  }
  function playPlayer() {
    while (state.hands[state.activeHand]?.complete) state.activeHand++;
    const hand = state.hands[state.activeHand];
    if (!hand) {
      stage = 'reveal';
      return;
    }
    if (score(hand.cards).total >= 21 || hand.splitAces) {
      hand.complete = true;
      hand.status = 'stand';
      return;
    }
    const action = playerAction(hand);
    const player =
      state.hands.length > 1 ? `Hand ${state.activeHand + 1}` : 'Player';
    if (action === 'split') {
      const aces = hand.cards[0].rank === 'A';
      const sister = emptyHand(true, aces);
      sister.cards.push(hand.cards.pop()!);
      hand.fromSplit = true;
      hand.splitAces = aces;
      state.hands.splice(state.activeHand + 1, 0, sister);
      splitDraws = [state.activeHand, state.activeHand + 1];
      stage = 'split-draw';
      state.message = `${player} splits.`;
    } else if (action === 'stand') {
      hand.complete = true;
      hand.status = 'stand';
      state.message = `${player} stands.`;
    } else {
      hand.cards.push(draw());
      hand.doubled = action === 'double';
      const total = score(hand.cards).total;
      hand.complete = total >= 21 || hand.doubled;
      hand.status = total > 21 ? 'bust' : hand.complete ? 'stand' : '';
      state.message = `${player} ${hand.doubled ? 'doubles' : 'hits'}${total > 21 ? ' and busts' : ''}.`;
    }
  }
  function finishRound() {
    const dealer = score(state.dealer);
    for (const hand of state.hands) {
      const player = score(hand.cards);
      hand.complete = true;
      hand.result =
        player.total > 21
          ? 'BUST'
          : dealer.blackjack
            ? player.blackjack && !hand.fromSplit
              ? 'PUSH'
              : 'LOSE'
            : player.blackjack && !hand.fromSplit
              ? 'BLACKJACK'
              : dealer.total > 21 || player.total > dealer.total
                ? 'WIN'
                : player.total === dealer.total
                  ? 'PUSH'
                  : 'LOSE';
    }
    state.completedRounds++;
    state.roundsSinceCheck++;
    state.message = 'Round complete. Keep your count.';
    stage = 'check';
  }
  function advance() {
    if (state.phase === 'feedback') {
      state.feedback = null;
      beginPractice();
      return;
    }
    switch (stage) {
      case 'new-round':
        beginRound();
        return;
      case 'opening': {
        const card = draw(opening === 3);
        if (opening % 2 === 0) state.hands[0].cards.push(card);
        else state.dealer.push(card);
        opening++;
        state.message = 'Watch the exposed cards.';
        if (opening === 4) {
          stage =
            score(state.hands[0].cards).blackjack ||
            score(state.dealer).blackjack
              ? 'reveal'
              : 'player';
          if (stage === 'player') {
            stage = 'initial-action';
            state.message = 'Player is deciding.';
            schedule(2000);
            return;
          }
        }
        break;
      }
      case 'initial-action':
        stage = 'player';
        playPlayer();
        break;
      case 'player':
        playPlayer();
        break;
      case 'split-draw': {
        const index = splitDraws.shift()!;
        const hand = state.hands[index];
        hand.cards.push(draw());
        if (hand.splitAces || score(hand.cards).total === 21) {
          hand.complete = true;
          hand.status = 'stand';
        }
        if (!splitDraws.length) stage = 'player';
        break;
      }
      case 'reveal':
        state.dealerRevealed = true;
        state.dealer.forEach(expose);
        state.message = 'Dealer reveals the hole card.';
        stage = 'dealer';
        break;
      case 'dealer': {
        const shouldPlay = state.hands.some(
          (hand) =>
            score(hand.cards).total <= 21 &&
            !(score(hand.cards).blackjack && !hand.fromSplit),
        );
        if (shouldPlay && score(state.dealer).total < 17) {
          state.dealer.push(draw());
          state.message =
            score(state.dealer).total > 21 ? 'Dealer busts.' : 'Dealer hits.';
        } else {
          stage = 'finish';
          state.message =
            score(state.dealer).total > 21
              ? 'Dealer busts.'
              : shouldPlay
                ? 'Dealer stands.'
                : 'Round complete.';
        }
        break;
      }
      case 'finish':
        finishRound();
        break;
      case 'check':
        if (state.roundsSinceCheck >= options.askEvery) {
          state.phase = 'question';
          state.message = 'What is the running count?';
          deadline = 0;
          return;
        }
        beginRound();
        return;
    }
    schedule();
  }
  function tick() {
    if (!canRun() || !deadline || Date.now() < deadline) return;
    deadline = 0;
    advance();
    publish();
  }
  function start() {
    if (draft) options = parseCountOptions(draft);
    repository.save(options);
    draft = null;
    active = true;
    state = { ...initialState(), started: true, panel: null };
    shoe = [];
    shoeTotal = 0;
    seen.clear();
    remaining = 0;
    deadline = 0;
    beginPractice();
    publish();
  }
  function openPanel(panel: Exclude<CountPanel, null>) {
    pauseClock();
    state.panel = panel;
    draft = panel === 'setup' || panel === 'options' ? { ...options } : null;
    publish();
  }
  function closePanel() {
    draft = null;
    state.panel = state.started ? null : 'menu';
    resumeClock();
    publish();
  }
  function applySettings() {
    if (!draft) return;
    const changedPace = options.pace !== draft.pace;
    const changedTest = options.test !== draft.test;
    options = parseCountOptions(draft);
    draft = { ...options };
    repository.save(options);
    if (changedTest && state.started) {
      const panel = state.panel;
      state = { ...initialState(), started: true, panel };
      shoe = [];
      shoeTotal = 0;
      seen.clear();
      deadline = 0;
      remaining = 0;
      beginPractice();
      publish();
      return;
    }
    if (changedPace && state.phase === 'playing' && stage !== 'initial-action')
      remaining = paceDelay(options);
    publish();
  }
  publish();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect() {
      const interval = setInterval(tick, 25);
      return () => clearInterval(interval);
    },
    configure() {
      active = true;
      openPanel('setup');
    },
    start,
    openPanel,
    closePanel,
    applySettings,
    updateOption<K extends keyof RunningCountOptions>(
      key: K,
      value: RunningCountOptions[K],
    ) {
      if (!draft) return;
      draft = parseCountOptions({ ...draft, [key]: value });
      publish();
    },
    submitCount(answer: number) {
      if (
        !active ||
        state.panel ||
        state.phase !== 'question' ||
        !validCountAnswer(options.test, answer)
      )
        return;
      const expected = state.question?.expected ?? state.runningCount;
      const correct = answer === expected;
      state.feedback = { answer, expected, correct };
      state.stats = recordCountAnswer(
        state.stats,
        options.test,
        answer,
        expected,
      );
      state.phase = 'feedback';
      state.roundsSinceCheck = 0;
      state.message = correct ? 'Correct!' : 'Review the count, then continue.';
      if (correct) schedule(1100);
      publish();
    },
    continuePractice() {
      if (!active || state.panel || state.phase !== 'feedback') return;
      beginPractice();
      publish();
    },
    togglePause() {
      if (state.panel || !state.started || state.phase !== 'playing') return;
      if (state.paused) {
        state.paused = false;
        resumeClock();
      } else {
        pauseClock();
        state.paused = true;
      }
      publish();
    },
    suspend() {
      pauseClock();
      active = false;
      publish();
    },
    activate() {
      active = true;
      closePanel();
    },
    backToMenu() {
      openPanel('menu');
    },
    discardSession() {
      active = false;
      deadline = 0;
      remaining = 0;
      draft = null;
      shoe = [];
      shoeTotal = 0;
      seen.clear();
      state = { ...initialState(), panel: 'menu' };
      publish();
    },
  };
}
export type RunningCountTrainer = ReturnType<typeof createRunningCountTrainer>;
