import "./DeckShoe.css";
import "98.css";
import { hiddenCard } from "../../enums";
import PlayingCard from "./PlayingCard";

const DeckShoe = () => {

  return (
    <div className="deck-shoe">
      <div className="bottom-deck-shoe-card">
        <PlayingCard card={hiddenCard} isFaceUp={false} />
      </div>
      <div className="middle-deck-shoe-card">
        <PlayingCard card={hiddenCard} isFaceUp={false} />
      </div>
      <div className="top-deck-shoe-card">
        <PlayingCard card={hiddenCard} isFaceUp={false} />
      </div>
    </div>
  );
};

export default DeckShoe;
