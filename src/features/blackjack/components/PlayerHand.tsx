import type { CSSProperties } from 'react';
import type { Hand } from '../model/types';
import { score } from '../model/cards';
import { money } from '../../../shared/lib/format';
import { PlayingCard } from './PlayingCard';
export function PlayerHand({
  hand,
  index,
  only,
  active,
  lastDealtId,
}: {
  hand: Hand;
  index: number;
  only: boolean;
  active: boolean;
  lastDealtId: number | null;
}) {
  const total = score(hand.cards).total;
  const profit = hand.payout - hand.bet;
  return (
    <div
      className={`hand-slot ${active ? 'current' : ''} ${hand.complete && !active ? 'finished' : ''}`}
      aria-label={`Hand ${index + 1}, ${total} points`}
      style={{ '--card-count': hand.cards.length } as CSSProperties}
    >
      <div className="seat-label">
        {only ? 'Your hand' : `Hand ${index + 1}`}{' '}
        <span className="score-pill">{total || '—'}</span>
      </div>
      <div className="cards stacked-cards">
        {hand.cards.map((card, i) => (
          <div
            key={card.id}
            className={`stack-card${hand.doubled && hand.cards.length === 3 && i === 2 ? ' double-card' : ''}${card.id === lastDealtId ? ' is-entering' : ''}`}
            style={{ '--card-index': i, zIndex: i + 1 } as CSSProperties}
          >
            <PlayingCard card={card} />
          </div>
        ))}
      </div>
      <div className="hand-under">
        {hand.result ? (
          <>
            <b
              className={
                ['WIN', 'BLACKJACK'].includes(hand.result)
                  ? 'hand-winner'
                  : hand.result === 'PUSH'
                    ? ''
                    : 'hand-loser'
              }
            >
              {hand.result}
            </b>
            {' ' +
              (profit > 0
                ? '+' + money(profit)
                : profit < 0
                  ? '-' + money(-profit)
                  : money(0))}
          </>
        ) : hand.complete ? (
          <>
            {hand.status === 'bust'
              ? 'BUST'
              : hand.status === 'surrender'
                ? 'SURRENDER'
                : 'STAND'}{' '}
            {money(hand.bet)}
          </>
        ) : (
          <>
            BET <b>{money(hand.bet)}</b>
          </>
        )}
      </div>
    </div>
  );
}
