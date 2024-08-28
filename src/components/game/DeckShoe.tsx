import "./DeckShoe.css";
import "98.css";
import { Card } from "../../enums";
import PlayingCard from "./PlayingCard";
import { BlackjackGame } from "../../blackjack";

interface DeckShoeProps {
  game: BlackjackGame | null;
}

const DeckShoe = ({ game }: DeckShoeProps) => {
  const dealHand = () => {
    if (game) {
      game.startGame();
    } else {
      console.error("Game instance is not available.");
    }
  };

  const hiddenCard: Card = { suit: "Hidden", rank: "Hidden" };

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
