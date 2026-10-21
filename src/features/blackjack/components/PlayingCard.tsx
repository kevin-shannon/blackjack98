import { memo } from 'react';
import { CARD_IMAGES } from '../../../assets/cards';
import { SUIT_NAMES, SUIT_SYMBOL } from '../model/constants';
import type { Card } from '../model/types';
export const PlayingCard = memo(function PlayingCard({
  card,
  hidden = false,
  entering = false,
}: {
  card: Card;
  hidden?: boolean;
  entering?: boolean;
}) {
  const asset = CARD_IMAGES[hidden ? 'back' : card.rank + card.suit];
  const name = hidden
    ? 'Face-down card'
    : `${card.rank} of ${SUIT_NAMES[card.suit]}`;
  const animation = entering ? ' card-enter' : '';
  if (asset)
    return (
      <div className={`playing-card image-card${animation}`} aria-label={name}>
        <img src={asset} alt="" draggable={false} />
      </div>
    );
  if (hidden)
    return (
      <div className={`playing-card card-back${animation}`} aria-label={name} />
    );
  const suit = SUIT_SYMBOL[card.suit];
  return (
    <div
      className={`playing-card${['H', 'D'].includes(card.suit) ? ' red' : ''}${animation}`}
      aria-label={name}
    >
      <div className="card-corner">
        <b>{card.rank}</b>
        <small>{suit}</small>
      </div>
      <div className="card-center">{suit}</div>
      <div className="card-corner bottom">
        <b>{card.rank}</b>
        <small>{suit}</small>
      </div>
    </div>
  );
});
