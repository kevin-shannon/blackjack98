import { BlackjackProvider } from '../features/blackjack/hooks/useBlackjack';
import { FreePlay } from '../features/blackjack/FreePlay';
import { ModeNavigationProvider, useModeNavigation } from './ModeNavigation';
import { BasicStrategy } from '../features/basic-strategy/BasicStrategy';
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
  return useModeNavigation().activeMode === 'free-play' ? (
    <FreePlay />
  ) : (
    <BasicStrategy />
  );
}
