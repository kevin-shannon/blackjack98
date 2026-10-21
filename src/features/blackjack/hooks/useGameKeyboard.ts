import { useEffect } from 'react';
import { useBlackjack } from './useBlackjack';
import type { PlayerAction } from '../model/types';
export function useGameKeyboard() {
  const { game } = useBlackjack();
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.repeat ||
        event.defaultPrevented
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          target.isContentEditable)
      )
        return;
      const { state } = game.getSnapshot();
      if (state.phase === 'insurance') return;
      if (state.panel) {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (state.panel === 'setup') game.backToMenu();
          else game.closePanel();
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        game.openPanel('menu');
        return;
      }
      if (
        event.key === 'Enter' &&
        ['betting', 'roundOver'].includes(state.phase)
      ) {
        // Let focused buttons keep their native Enter behavior.
        if (target instanceof HTMLButtonElement) return;
        event.preventDefault();
        void game.deal();
        return;
      }
      if (state.phase !== 'playing') return;
      const keys: Record<string, PlayerAction> = {
        h: 'hit',
        s: 'stand',
        d: 'double',
        p: 'split',
        r: 'surrender',
      };
      const action = keys[event.key.toLowerCase()];
      if (action) {
        event.preventDefault();
        void game.act(action);
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [game]);
}
