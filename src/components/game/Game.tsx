import { useState, useEffect } from "react";
import ActionPanel from "./ActionPanel";
import DeckShoe from "./DeckShoe";
import "./Game.css";
import "98.css";
import { BlackjackGame } from "../../blackjack";
import PlayerHand from "./PlayerHand";
import DealerHand from "./DealerHand";
import { GameMode } from "../../enums";

interface GameProps {
  gameMode: GameMode;
}

function Game({ gameMode }: GameProps) {
  let game = new BlackjackGame(gameMode);
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
      <ActionPanel startGame={game.startGame.bind(game)} />
      <DeckShoe />
      <PlayerHand hand={game.getPlayerHand()} />
      <DealerHand hand={game.getDealerHand()} />
    </div>
  );
}

export default Game;
