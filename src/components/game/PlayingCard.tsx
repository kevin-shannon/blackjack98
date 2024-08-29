import React, { useState } from "react";
import "./PlayingCard.css";
import "98.css";
import { Card } from "../../enums";

interface PlayingCardProps {
  card: Card;
  isFaceUp: boolean;
  style?: React.CSSProperties;
}

function PlayingCard({ card, isFaceUp, style }: PlayingCardProps) {
  const [faceUp] = useState(isFaceUp);

  const cardImage = faceUp ? `cards/${card.suit}_${card.rank}.png` : "cards/backs/card_back.png";

  return (
    <div className="playing-card" style={style} onClick={() => {}}>
      <img src={`${process.env.PUBLIC_URL}/${cardImage}`} alt={card.rank} />
    </div>
  );
}

export default PlayingCard;
