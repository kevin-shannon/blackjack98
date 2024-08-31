import "./DeckShoe.css";
import "98.css";
import { hiddenCard } from "../../enums";
import PlayingCard from "./PlayingCard";

interface DeckShoeProps {
  startGame: () => Promise<void> | null;
}

const DeckShoe = ({ startGame }: DeckShoeProps) => {
  const dealHand = () => {
    if (startGame) {
      startGame();
    } else {
      console.error("Game instance is not available.");
    }
  };

  return (
    <div className="deck-shoe" onClick={dealHand}>
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
