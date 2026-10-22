import { useBlackjack } from './hooks/useBlackjack';
import { useGameKeyboard } from './hooks/useGameKeyboard';
import { money } from '../../shared/lib/format';
import { GameWindow } from '../../shared/ui/GameWindow';
import { BlackjackTable } from './components/BlackjackTable';
import { BetControls } from './components/BetControls';
import { TableActions } from './components/TableActions';
import { GameDialogs } from './components/GameDialogs';

export function FreePlay() {
  const { game, state, rules } = useBlackjack();
  useGameKeyboard();
  return (
    <>
      <GameWindow
        started={state.modeStarted}
        modalOpen={Boolean(state.panel || state.phase === 'insurance')}
        title="FREE PLAY"
        rulesSummary={`${rules.decks} ${rules.decks === 1 ? 'DECK' : 'DECKS'} · ${rules.hitSoft17 ? 'HIT' : 'STAND'} SOFT 17 · ${rules.payout} PAYOUT`}
        onMenu={() => game.openPanel('menu')}
        onReset={() => game.openPanel('reset')}
        onRules={() => game.openPanel('rules')}
        onOptions={() => game.openPanel('options')}
        onHelp={() => game.openPanel('help')}
        footer={
          <div className="session-stats">
            SESSION{' '}
            <b>
              {(state.stats.sessionNet > 0 ? '+' : '') +
                money(state.stats.sessionNet)}
            </b>
            <span className="divider-dot">·</span>W <b>{state.stats.wins}</b> /
            L <b>{state.stats.losses}</b> / P <b>{state.stats.pushes}</b>
          </div>
        }
      >
        <BlackjackTable />
        <div className="control-panel">
          <BetControls />
          <TableActions />
        </div>
      </GameWindow>
      <GameDialogs />
    </>
  );
}
