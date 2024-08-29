import { useState, useEffect } from "react";
import ActionPanel from "./ActionPanel";
import DeckShoe from "./DeckShoe";
import { Action } from "../../enums";
import "./Game.css";
import "98.css";
import { BlackjackGame } from "../../blackjack";
import PlayerHand from "./PlayerHand";

function Game() {
  const waitForPlayerAction = (): Promise<Action> => {
    return new Promise<Action>((resolve) => {
      setActionPromise(() => resolve);
    });
  };
  const [actionPromise, setActionPromise] = useState<(action: Action) => void | null>();
  const [game, setGame] = useState<BlackjackGame>(new BlackjackGame(1, waitForPlayerAction));

  const handlePlayerAction = (action: Action) => {
    if (actionPromise) {
      actionPromise(action);
    }
  };

  useEffect(() => {
    const newGame = new BlackjackGame(1, waitForPlayerAction);
    setGame(newGame);
  }, []);

  return (
    <div style={{ width: 500, height: 500, backgroundColor: "var(--primary-jade)" }}>
      <ActionPanel resolveAction={handlePlayerAction} />
      <DeckShoe game={game} />
      <PlayerHand hand={game.getPlayerHand()} />
    </div>
  );
}

export default Game;
