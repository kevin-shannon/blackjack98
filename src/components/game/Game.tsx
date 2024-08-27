import ActionPanel from "./ActionPanel";
import PlayingCard from "./PlayingCard";
import "./Game.css";
import "98.css";

function Game() {
  return (
    <div style={{ width: 500, height: 500, backgroundColor: "var(--primary-jade)" }}>
      <ActionPanel />
      <PlayingCard />
    </div>
  );
}

export default Game;
