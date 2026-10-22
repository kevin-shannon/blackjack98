import { useSyncExternalStore } from 'react';
import { useModeNavigation } from '../../../app/ModeNavigation';

export function useStrategyTrainer() {
  const { trainer } = useModeNavigation();
  return {
    trainer,
    ...useSyncExternalStore(trainer.subscribe, trainer.getSnapshot),
  };
}
