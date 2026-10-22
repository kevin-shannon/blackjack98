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

interface Navigation {
  activeMode: TrainingModeId;
  trainer: StrategyTrainer;
  selectMode: (mode: TrainingModeId) => void;
  resumeMode: (mode: TrainingModeId) => void;
  canResume: (mode: TrainingModeId) => boolean;
}
const NavigationContext = createContext<Navigation | null>(null);
/** Both controllers live above the mode switch; changing screens never mixes or resets their stats. */
export function ModeNavigationProvider({ children }: { children: ReactNode }) {
  const { game } = useBlackjack();
  const [trainer] = useState(() => createStrategyTrainer());
  const [activeMode, setActiveMode] = useState<TrainingModeId>('free-play');
  useEffect(() => trainer.connect(), [trainer]);
  const selectMode = useCallback(
    (mode: TrainingModeId) => {
      game.openPanel('menu');
      trainer.suspend();
      if (mode === 'free-play') game.configureFreePlay();
      else trainer.configure();
      setActiveMode(mode);
    },
    [game, trainer],
  );
  const resumeMode = useCallback(
    (mode: TrainingModeId) => {
      game.openPanel('menu');
      trainer.suspend();
      if (mode === 'free-play') game.closePanel();
      else trainer.activate();
      setActiveMode(mode);
    },
    [game, trainer],
  );
  const value = useMemo(
    () => ({
      activeMode,
      trainer,
      selectMode,
      resumeMode,
      canResume: (mode: TrainingModeId) =>
        mode === 'free-play'
          ? game.getSnapshot().state.modeStarted
          : trainer.getSnapshot().state.started,
    }),
    [activeMode, trainer, selectMode, resumeMode, game],
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
