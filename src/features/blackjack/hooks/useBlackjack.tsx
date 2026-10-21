import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { createBlackjackGame } from '../model/createBlackjackGame';
import type { BlackjackGame } from '../model/createBlackjackGame';
const GameContext = createContext<BlackjackGame | null>(null);
export function BlackjackProvider({ children }: { children: ReactNode }) {
  const [game] = useState(() => createBlackjackGame());
  useEffect(() => game.connect(), [game]);
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}
export function useBlackjack() {
  const game = useContext(GameContext);
  if (!game) throw new Error('useBlackjack requires BlackjackProvider');
  const snapshot = useSyncExternalStore(game.subscribe, game.getSnapshot);
  return { game, ...snapshot };
}
