import ActionPanel from "./ActionPanel";
import PlayingCard from "./PlayingCard";
import "./Game.css";
import "98.css";
import { Suit, Rank } from "../../enums";

function Game() {
  return (
    <div style={{ width: 500, height: 500, backgroundColor: "var(--primary-jade)" }}>
      <ActionPanel />
      <PlayingCard suit={Suit.HEART} rank={"A"} isFaceUp={true} />
    </div>
  );
}

export default Game;
