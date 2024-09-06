import "./PlayerHand.css";
import "98.css";
import { Deck } from "../../enums";
import PlayingCard from "./PlayingCard";

interface PlayerHandProps {
  hand: Deck[]; // Updated to an array of hands
}

const PlayerHand = ({ hand }: PlayerHandProps) => {
  return (
    <div className="player-hands">
      {hand.map((hand, handIndex) => (
        <div className="player-hand" key={handIndex} style={{ marginBottom: "20px" }}>
          {hand.map((card, index) => {
            const xOffset = index * 20;
            const yOffset = index * -20;
            return <PlayingCard key={index} card={card} isFaceUp={true} style={{ transform: `translate(${xOffset}px, ${yOffset}px)` }} />;
          })}
        </div>
      ))}
    </div>
  );
};

export default PlayerHand;
