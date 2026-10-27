import { BlackjackProvider } from '../features/blackjack/hooks/useBlackjack';
import { FreePlay } from '../features/blackjack/FreePlay';
import { ModeNavigationProvider, useModeNavigation } from './ModeNavigation';
import { BasicStrategy } from '../features/basic-strategy/BasicStrategy';
import { Deviations } from '../features/deviations/Deviations';
import { RunningCount } from '../features/running-count/RunningCount';
export function App() {
  return (
    <BlackjackProvider>
      <ModeNavigationProvider>
        <ModeScreen />
      </ModeNavigationProvider>
    </BlackjackProvider>
  );
}
function ModeScreen() {
  switch (useModeNavigation().activeMode) {
    case 'free-play':
      return <FreePlay />;
    case 'basic-strategy':
      return <BasicStrategy />;
    case 'deviations':
      return <Deviations />;
    case 'running-count':
      return <RunningCount />;
  }
}
