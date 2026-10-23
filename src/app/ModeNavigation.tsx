import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { TrainingModeId } from './trainingModes';
import { useBlackjack } from '../features/blackjack/hooks/useBlackjack';
import { createStrategyTrainer } from '../features/basic-strategy/model/createStrategyTrainer';
import type { StrategyTrainer } from '../features/basic-strategy/model/createStrategyTrainer';
import { createDeviationTrainer } from '../features/deviations/model/createDeviationTrainer';
import type { DeviationTrainer } from '../features/deviations/model/createDeviationTrainer';

interface Navigation {
  activeMode: TrainingModeId;
  trainer: StrategyTrainer;
  deviationTrainer: DeviationTrainer;
  selectMode: (mode: TrainingModeId) => void;
  resumeMode: (mode: TrainingModeId) => void;
  canResume: (mode: TrainingModeId) => boolean;
}
const NavigationContext = createContext<Navigation | null>(null);
/** Controllers live above the mode switch; changing screens keeps each session separate. */
export function ModeNavigationProvider({ children }: { children: ReactNode }) {
  const { game } = useBlackjack();
  const [trainer] = useState(() => createStrategyTrainer());
  const [deviationTrainer] = useState(() => createDeviationTrainer());
  const [activeMode, setActiveMode] = useState<TrainingModeId>('free-play');
  useEffect(() => trainer.connect(), [trainer]);
  useEffect(() => deviationTrainer.connect(), [deviationTrainer]);
  const selectMode = useCallback(
    (mode: TrainingModeId) => {
      game.openPanel('menu');
      trainer.suspend();
      deviationTrainer.suspend();
      if (mode === 'free-play') game.configureFreePlay();
      else if (mode === 'basic-strategy') trainer.configure();
      else deviationTrainer.configure();
      setActiveMode(mode);
    },
    [game, trainer, deviationTrainer],
  );
  const resumeMode = useCallback(
    (mode: TrainingModeId) => {
      game.openPanel('menu');
      trainer.suspend();
      deviationTrainer.suspend();
      if (mode === 'free-play') game.closePanel();
      else if (mode === 'basic-strategy') trainer.activate();
      else deviationTrainer.activate();
      setActiveMode(mode);
    },
    [game, trainer, deviationTrainer],
  );
  const value = useMemo(
    () => ({
      activeMode,
      trainer,
      deviationTrainer,
      selectMode,
      resumeMode,
      canResume: (mode: TrainingModeId) =>
        mode === 'free-play'
          ? game.getSnapshot().state.modeStarted
          : mode === 'basic-strategy'
            ? trainer.getSnapshot().state.started
            : deviationTrainer.getSnapshot().state.started,
    }),
    [activeMode, trainer, deviationTrainer, selectMode, resumeMode, game],
  );
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
export function useModeNavigation() {
  const value = useContext(NavigationContext);
  if (!value)
    throw new Error('Mode navigation requires ModeNavigationProvider');
  return value;
}
