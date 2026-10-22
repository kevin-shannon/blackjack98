import type { PlayerAction } from '../../blackjack/model/types';
import { value } from '../../blackjack/model/cards';
import {
  createBasicStrategyStats,
  recordStrategyAnswer,
} from '../../stats/sessionStats';
import { dealDifficultQuestion, dealQuestion } from './questions';
import { recommendAction, explainDecision } from './strategy';
import { strategySettingsRepository, parseStrategySettings } from './settings';
import type { StrategySettingsRepository } from './settings';
import type {
  StrategyOptions,
  StrategyPanel,
  StrategyQuestion,
  StrategyRules,
  StrategySnapshot,
  StrategyState,
} from './types';

export const FEEDBACK_MS = 1100;
export function createStrategyTrainer(
  dependencies: {
    random?: () => number;
    settings?: StrategySettingsRepository;
    question?: (id: number) => StrategyQuestion;
  } = {},
) {
  const repository = dependencies.settings ?? strategySettingsRepository;
  let settings = parseStrategySettings(repository.load());
  let draft: typeof settings | null = null;
  let active = false,
    deadline = 0,
    remaining = 0,
    questionId = 0;
  const state: StrategyState = {
    started: false,
    panel: 'setup',
    phase: 'idle',
    question: null,
    feedback: null,
    stats: createBasicStrategyStats(),
  };
  const listeners = new Set<() => void>();
  let snapshot: StrategySnapshot;
  function seconds() {
    return state.phase === 'answering' && settings.options.timedHands
      ? Math.max(
          0,
          Math.ceil((deadline ? deadline - Date.now() : remaining) / 1000),
        )
      : null;
  }
  function publish() {
    snapshot = {
      state: structuredClone(state),
      settings: structuredClone(settings),
      draft: draft && structuredClone(draft),
      timerSeconds: seconds(),
    };
    listeners.forEach((listener) => listener());
  }
  function pause() {
    if (deadline) {
      remaining = Math.max(0, deadline - Date.now());
      deadline = 0;
    }
  }
  function resume() {
    if (
      active &&
      state.started &&
      !state.panel &&
      (state.phase === 'feedback' || settings.options.timedHands)
    )
      deadline = Date.now() + remaining;
  }
  function nextQuestion() {
    questionId++;
    state.question =
      dependencies.question?.(questionId) ??
      (settings.options.difficulty === 'difficult'
        ? dealDifficultQuestion(
            dependencies.random ?? Math.random,
            questionId,
            settings.rules,
          )
        : dealQuestion(dependencies.random ?? Math.random, questionId));
    state.phase = 'answering';
    state.feedback = null;
    remaining = settings.options.timedHands
      ? settings.options.seconds * 1000
      : 0;
    deadline = 0;
    resume();
    publish();
  }
  function canAnswer(action: PlayerAction) {
    if (
      !active ||
      !state.started ||
      state.panel ||
      state.phase !== 'answering' ||
      !state.question
    )
      return false;
    if (action === 'surrender') return settings.rules.surrender;
    if (action === 'split')
      return value(state.question.cards[0]) === value(state.question.cards[1]);
    return true;
  }
  function answer(selected: PlayerAction | null) {
    if (
      !active ||
      state.panel ||
      state.phase !== 'answering' ||
      !state.question
    )
      return;
    if (selected && !canAnswer(selected)) return;
    const timedOut =
      selected === null ||
      (settings.options.timedHands && deadline > 0 && Date.now() >= deadline);
    if (timedOut) selected = null;
    const expected = recommendAction(
      state.question.cards,
      state.question.dealer,
      settings.rules,
    );
    const correct = selected === expected;
    state.stats = recordStrategyAnswer(state.stats, correct, timedOut);
    state.feedback = {
      selected,
      expected,
      correct,
      timedOut,
      explanation: explainDecision(
        state.question.cards,
        state.question.dealer,
        settings.rules,
      ),
    };
    state.phase = 'feedback';
    remaining = FEEDBACK_MS;
    deadline = Date.now() + remaining;
    publish();
  }
  function tick() {
    if (!active || !state.started || state.panel || !deadline) return;
    if (Date.now() >= deadline) {
      if (state.phase === 'feedback') nextQuestion();
      else answer(null);
    } else if (snapshot.timerSeconds !== seconds()) publish();
  }
  function openPanel(panel: Exclude<StrategyPanel, null>) {
    pause();
    state.panel = panel;
    publish();
  }
  function closePanel() {
    if (!state.started) {
      backToMenu();
      return;
    }
    state.panel = null;
    resume();
    publish();
  }
  function configure() {
    active = true;
    pause();
    draft = structuredClone(settings);
    state.panel = 'setup';
    publish();
  }
  function backToMenu() {
    draft = null;
    openPanel('menu');
  }
  function start() {
    if (draft) settings = parseStrategySettings(draft);
    repository.save(settings);
    draft = null;
    active = true;
    state.started = true;
    state.panel = null;
    resetSession();
  }
  function resetSession() {
    state.stats = createBasicStrategyStats();
    nextQuestion();
  }
  function updateRule<K extends keyof StrategyRules>(
    key: K,
    value: StrategyRules[K],
  ) {
    const target = state.panel === 'setup' ? draft : settings;
    if (!target || target.rules[key] === value) return;
    target.rules[key] = value;
    if (state.panel !== 'setup') {
      repository.save(settings);
      if (state.started) {
        resetSession();
        return;
      }
    }
    publish();
  }
  function updateOption<K extends keyof StrategyOptions>(
    key: K,
    value: StrategyOptions[K],
  ) {
    const target = state.panel === 'setup' ? draft : settings;
    if (!target || target.options[key] === value) return;
    target.options[key] = value;
    if (state.panel !== 'setup') {
      settings = parseStrategySettings(settings);
      repository.save(settings);
      if (key === 'difficulty' && state.started) {
        nextQuestion();
        return;
      }
      if (state.phase === 'answering') {
        deadline = 0;
        remaining = settings.options.seconds * 1000;
        resume();
      }
    }
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
      resume();
      const interval = setInterval(tick, 50);
      return () => {
        pause();
        clearInterval(interval);
      };
    },
    configure,
    openPanel,
    closePanel,
    backToMenu,
    start,
    answer,
    canAnswer,
    updateRule,
    updateOption,
    suspend() {
      pause();
      active = false;
      state.panel = 'menu';
      publish();
    },
    activate() {
      active = true;
      closePanel();
    },
  };
}
export type StrategyTrainer = ReturnType<typeof createStrategyTrainer>;
