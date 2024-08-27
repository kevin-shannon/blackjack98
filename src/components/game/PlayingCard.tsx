import React, { useState } from "react";
import "./PlayingCard.css";
import "98.css";
import { Suit, Rank } from "../../enums";

interface PlayingCardProps {
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
}

const PlayingCard: React.FC<PlayingCardProps> = ({ suit, rank, isFaceUp }) => {
  const [faceUp, setFaceUp] = useState(isFaceUp);

  const cardImage = faceUp ? `cards/${suit}_${rank}.png` : "cards/backs/card_back.png";

  const toggleCard = () => {
    setFaceUp(!faceUp);
  };

  return (
    <div className="playing-card" onClick={toggleCard}>
      <img src={cardImage} />
    </div>
  );
};

export default PlayingCard;
