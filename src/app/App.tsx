import { BlackjackProvider } from '../features/blackjack/hooks/useBlackjack';
import { FreePlay } from '../features/blackjack/FreePlay';
export function App() {
  return (
    <BlackjackProvider>
      <FreePlay />
    </BlackjackProvider>
  );
}
