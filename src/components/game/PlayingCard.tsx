import React, { useState } from "react";
import "./PlayingCard.css";
import "98.css";
import { Card, hiddenCard } from "../../enums";

interface PlayingCardProps {
  card: Card;
  isFaceUp: boolean;
  style?: React.CSSProperties;
}

function PlayingCard({ card, isFaceUp, style }: PlayingCardProps) {
  const [faceUp] = useState(isFaceUp);
  const cardImage = faceUp && card !== undefined && card !== hiddenCard ? `cards/${card.suit}_${card.rank}.png` : "cards/backs/card_back.png";

  return (
    <div className="playing-card" style={style} onClick={() => {}}>
      <img src={`${process.env.PUBLIC_URL}/${cardImage}`} alt={card ? card.rank : "facedown card"} />
    </div>
  );
}

export default PlayingCard;
