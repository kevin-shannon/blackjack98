import "./DealerHand.css";
import "98.css";
import { Deck } from "../../enums";
import PlayingCard from "./PlayingCard";

interface DealerHandProps {
  hand: Deck;
}

const DealerHand = ({ hand }: DealerHandProps) => {
  return (
    <div className="dealer-hand">
      {hand.map((card, index) => {
        const xOffset = index * 80;
        return <PlayingCard key={index} card={card} isFaceUp={true} style={{ transform: `translate(${xOffset}px` }} />;
      })}
    </div>
  );
};

export default DealerHand;
