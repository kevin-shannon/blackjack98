import React, { useState } from "react";
import ActionPanel from "./ActionPanel";
import DeckShoe from "./DeckShoe";
import { Action } from "../../enums";
import "./Game.css";
import "98.css";
import { BlackjackGame } from "../../blackjack";

const Game: React.FC = () => {
  const [actionPromise, setActionPromise] = useState<(action: Action) => void | null>();

  const waitForPlayerAction = (): Promise<Action> => {
    return new Promise<Action>((resolve) => {
      setActionPromise(() => resolve);
    });
  };

  const handlePlayerAction = (action: Action) => {
    if (actionPromise) {
      actionPromise(action);
    }
  };

  const game = new BlackjackGame(1, waitForPlayerAction);

  return (
    <div style={{ width: 500, height: 500, backgroundColor: "var(--primary-jade)" }}>
      <ActionPanel resolveAction={handlePlayerAction} />
      <DeckShoe game={game} />
    </div>
  );
};

export default Game;
