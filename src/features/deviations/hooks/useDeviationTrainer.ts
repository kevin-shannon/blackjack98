import { useSyncExternalStore } from 'react';
import { useModeNavigation } from '../../../app/ModeNavigation';

export function useDeviationTrainer() {
  const { deviationTrainer: trainer } = useModeNavigation();
  return {
    trainer,
    ...useSyncExternalStore(trainer.subscribe, trainer.getSnapshot),
  };
}
