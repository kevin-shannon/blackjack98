import React from "react";
import "./PlayerHand.css";
import "98.css";
import { Deck } from "../../enums";
import PlayingCard from "./PlayingCard";

interface PlayerHandProps {
  hand: Deck;
}

const PlayerHand = ({ hand }: PlayerHandProps) => {
  return (
    <div className="player-hand">
      {hand.map((card, index) => {
        const xOffset = index * 20;
        const yOffset = index * -10;
        return <PlayingCard key={index} card={card} isFaceUp={true} style={{ transform: `translate(${xOffset}px, ${yOffset}px)` }} />;
      })}
    </div>
  );
};

export default PlayerHand;
