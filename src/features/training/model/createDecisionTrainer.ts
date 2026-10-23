import {
  createPracticeStats,
  recordStrategyAnswer,
} from '../../stats/sessionStats';
import type {
  PracticePanel,
  TimedPracticeOptions,
  PracticeSettings,
  PracticeSettingsRepository,
  PracticeSnapshot,
  PracticeState,
} from './types';

export const FEEDBACK_MS = 1100;
/** Shared rapid-fire lifecycle; each mode owns its questions, grading, settings, and stats. */
export function createDecisionTrainer<
  Rules extends object,
  Options extends TimedPracticeOptions,
  Question,
  Action extends string,
  Mode extends string,
>(
  config: {
    modeId: Mode;
    settings: PracticeSettingsRepository<PracticeSettings<Rules, Options>>;
    parseSettings: (value: unknown) => PracticeSettings<Rules, Options>;
    dealQuestion: (
      random: () => number,
      id: number,
      settings: PracticeSettings<Rules, Options>,
    ) => Question;
    recommendAction: (question: Question, rules: Rules) => Action;
    explainDecision: (question: Question, rules: Rules) => string;
    canAnswer: (question: Question, action: Action, rules: Rules) => boolean;
    optionChange: (key: keyof Options) => 'reset' | 'replace' | 'timer';
  },
  dependencies: {
    random?: () => number;
    settings?: PracticeSettingsRepository<PracticeSettings<Rules, Options>>;
    question?: (id: number) => Question;
  } = {},
) {
  const repository = dependencies.settings ?? config.settings;
  let settings = config.parseSettings(repository.load());
  let draft: typeof settings | null = null;
  let active = false,
    deadline = 0,
    remaining = 0,
    questionId = 0;
  const state: PracticeState<Question, Action, Mode> = {
    started: false,
    panel: 'setup',
    phase: 'idle',
    question: null,
    feedback: null,
    stats: createPracticeStats(config.modeId),
  };
  const listeners = new Set<() => void>();
  let snapshot: PracticeSnapshot<Rules, Options, Question, Action, Mode>;
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
      (state.phase === 'feedback' ||
        (state.phase === 'answering' && settings.options.timedHands))
    )
      deadline = Date.now() + remaining;
  }
  function nextQuestion() {
    questionId++;
    state.question =
      dependencies.question?.(questionId) ??
      config.dealQuestion(
        dependencies.random ?? Math.random,
        questionId,
        settings,
      );
    state.phase = 'answering';
    state.feedback = null;
    remaining = settings.options.timedHands
      ? settings.options.seconds * 1000
      : 0;
    deadline = 0;
    resume();
    publish();
  }
  function canAnswer(action: Action) {
    if (
      !active ||
      !state.started ||
      state.panel ||
      state.phase !== 'answering' ||
      !state.question
    )
      return false;
    return config.canAnswer(state.question, action, settings.rules);
  }
  function answer(selected: Action | null) {
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
    const expected = config.recommendAction(state.question, settings.rules);
    const correct = selected === expected;
    state.stats = recordStrategyAnswer(state.stats, correct, timedOut);
    state.feedback = {
      selected,
      expected,
      correct,
      timedOut,
      explanation: config.explainDecision(state.question, settings.rules),
    };
    state.phase =
      !correct && !settings.options.skipExplanations ? 'review' : 'feedback';
    remaining = FEEDBACK_MS;
    deadline = state.phase === 'feedback' ? Date.now() + remaining : 0;
    publish();
  }
  function nextHand() {
    if (!active || state.panel || state.phase !== 'review') return;
    nextQuestion();
  }
  function tick() {
    if (!active || !state.started || state.panel || !deadline) return;
    if (Date.now() >= deadline) {
      if (state.phase === 'feedback') nextQuestion();
      else answer(null);
    } else if (snapshot.timerSeconds !== seconds()) publish();
  }
  function openPanel(panel: Exclude<PracticePanel, null>) {
    pause();
    draft =
      panel === 'rules' || panel === 'options'
        ? structuredClone(settings)
        : null;
    state.panel = panel;
    publish();
  }
  function closePanel() {
    draft = null;
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
    if (draft) settings = config.parseSettings(draft);
    repository.save(settings);
    draft = null;
    active = true;
    state.started = true;
    state.panel = null;
    resetSession();
  }
  function resetSession() {
    state.stats = createPracticeStats(config.modeId);
    nextQuestion();
  }
  function applySettings() {
    if (!draft || (state.panel !== 'rules' && state.panel !== 'options'))
      return;
    const previous = settings;
    settings = config.parseSettings(draft);
    const rulesChanged =
      JSON.stringify(previous.rules) !== JSON.stringify(settings.rules);
    const changedOptions = (
      Object.keys(settings.options) as (keyof Options)[]
    ).filter((key) => previous.options[key] !== settings.options[key]);
    if (!rulesChanged && changedOptions.length === 0) return;
    repository.save(settings);
    draft = structuredClone(settings);
    if (
      state.started &&
      (rulesChanged ||
        changedOptions.some((key) => config.optionChange(key) === 'reset'))
    ) {
      resetSession();
      return;
    }
    if (
      state.started &&
      changedOptions.some(
        (key) =>
          key !== 'skipExplanations' && config.optionChange(key) !== 'timer',
      )
    ) {
      nextQuestion();
      return;
    }
    if (
      changedOptions.includes('skipExplanations') &&
      state.feedback &&
      !state.feedback.correct
    ) {
      state.phase = settings.options.skipExplanations ? 'feedback' : 'review';
      remaining = FEEDBACK_MS;
      deadline = 0;
    } else if (
      state.phase === 'answering' &&
      changedOptions.some((key) => key === 'timedHands' || key === 'seconds')
    ) {
      deadline = 0;
      remaining = settings.options.seconds * 1000;
    }
    publish();
  }
  function updateRule<K extends keyof Rules>(key: K, value: Rules[K]) {
    const target = draft ?? settings;
    if (!target || target.rules[key] === value) return;
    target.rules[key] = value;
    if (!draft) {
      repository.save(settings);
      if (state.started) {
        resetSession();
        return;
      }
    }
    publish();
  }
  function updateOption<K extends keyof Options>(key: K, value: Options[K]) {
    const target = draft ?? settings;
    if (!target || target.options[key] === value) return;
    target.options[key] = value;
    if (!draft) {
      settings = config.parseSettings(settings);
      repository.save(settings);
      if (key === 'skipExplanations') {
        if (state.feedback && !state.feedback.correct) {
          state.phase = settings.options.skipExplanations
            ? 'feedback'
            : 'review';
          remaining = FEEDBACK_MS;
          deadline = 0;
          resume();
        }
        publish();
        return;
      }
      const change = config.optionChange(key);
      if (state.started && change !== 'timer') {
        if (change === 'reset') resetSession();
        else nextQuestion();
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
    applySettings,
    backToMenu,
    start,
    answer,
    nextHand,
    canAnswer,
    updateRule,
    updateOption,
    discardSession() {
      active = false;
      deadline = 0;
      remaining = 0;
      draft = null;
      state.started = false;
      state.panel = 'menu';
      state.phase = 'idle';
      state.question = null;
      state.feedback = null;
      state.stats = createPracticeStats(config.modeId);
      publish();
    },
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
