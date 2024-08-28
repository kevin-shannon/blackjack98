import React, { useState } from "react";
import "./PlayingCard.css";
import "98.css";
import { Card } from "../../enums";

interface PlayingCardProps {
  card: Card;
  isFaceUp: boolean;
}

function PlayingCard({ card, isFaceUp }: PlayingCardProps) {
  const [faceUp, setFaceUp] = useState(isFaceUp);

  const cardImage = faceUp ? `cards/${card.suit}_${card.rank}.png` : "cards/backs/card_back.png";

  const toggleCard = () => {
    setFaceUp(!faceUp);
  };

  return (
    <div className="playing-card" onClick={() => {}}>
      <img src={cardImage} />
    </div>
  );
}

export default PlayingCard;
