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
  resumeGame: () => void;
  canResume: () => boolean;
}
const NavigationContext = createContext<Navigation | null>(null);
/** Only the selected mode keeps a session; changing modes discards the previous run. */
export function ModeNavigationProvider({ children }: { children: ReactNode }) {
  const { game } = useBlackjack();
  const [trainer] = useState(() => createStrategyTrainer());
  const [deviationTrainer] = useState(() => createDeviationTrainer());
  const [activeMode, setActiveMode] = useState<TrainingModeId>('free-play');
  useEffect(() => trainer.connect(), [trainer]);
  useEffect(() => deviationTrainer.connect(), [deviationTrainer]);
  const selectMode = useCallback(
    (mode: TrainingModeId) => {
      if (mode !== activeMode) {
        if (activeMode === 'free-play') game.discardSession();
        else if (activeMode === 'basic-strategy') trainer.discardSession();
        else deviationTrainer.discardSession();
      }
      game.openPanel('menu');
      trainer.suspend();
      deviationTrainer.suspend();
      if (mode === 'free-play') game.configureFreePlay();
      else if (mode === 'basic-strategy') trainer.configure();
      else deviationTrainer.configure();
      setActiveMode(mode);
    },
    [activeMode, game, trainer, deviationTrainer],
  );
  const resumeGame = useCallback(() => {
    if (activeMode === 'free-play') game.closePanel();
    else if (activeMode === 'basic-strategy') trainer.activate();
    else deviationTrainer.activate();
  }, [activeMode, game, trainer, deviationTrainer]);
  const value = useMemo(
    () => ({
      activeMode,
      trainer,
      deviationTrainer,
      selectMode,
      resumeGame,
      canResume: () =>
        activeMode === 'free-play'
          ? game.getSnapshot().state.modeStarted
          : activeMode === 'basic-strategy'
            ? trainer.getSnapshot().state.started
            : deviationTrainer.getSnapshot().state.started,
    }),
    [activeMode, trainer, deviationTrainer, selectMode, resumeGame, game],
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
