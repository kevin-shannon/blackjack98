import { useState, useEffect } from "react";
import ActionPanel from "./ActionPanel";
import DeckShoe from "./DeckShoe";
import "./Game.css";
import "98.css";
import { BlackjackGame } from "../../blackjack";
import PlayerHand from "./PlayerHand";
import DealerHand from "./DealerHand";

let game = new BlackjackGame(6);

function Game() {
  const [, setGameState] = useState({
    playerHand: game.getPlayerHand(),
    dealerHand: game.getDealerHand(),
  });

  // This function will be called whenever the game state changes
  const handleGameStateChange = () => {
    setGameState({
      playerHand: game.getPlayerHand(),
      dealerHand: game.getDealerHand(),
    });
  };

  // Register the change handler when the component mounts
  useEffect(() => {
    game.onStateChange(handleGameStateChange);

    // Cleanup when the component unmounts
    return () => {
      game.offStateChange(handleGameStateChange);
    };
  }, []);
  return (
    <div style={{ width: 640, height: 480, backgroundColor: "var(--primary-jade)" }}>
      <ActionPanel />
      <DeckShoe startGame={game.startGame.bind(game)} />
      <PlayerHand hand={game.getPlayerHand()} />
      <DealerHand hand={game.getDealerHand()} />
    </div>
  );
}

export default Game;
