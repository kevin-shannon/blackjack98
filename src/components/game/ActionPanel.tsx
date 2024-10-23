import React from "react";
import "./ActionPanel.css";
import "98.css";
import { Action } from "../../enums";
import ActionButton from "./ActionButton";

interface ActionPanelProps {
  startGame: () => Promise<void> | null;
}

const ActionPanel = ({ startGame }: ActionPanelProps) => {
  const dealHand = () => {
    if (startGame) {
      startGame();
    } else {
      console.error("Game instance is not available.");
    }
  };

  return (
    <div className="action-panel">
      <div className="action-panel-row">
        <button className="deal-button" onClick={dealHand}>Deal</button>
      </div>
      <div className="action-panel-row">
        <ActionButton action={Action.HIT} text="Hit" size="big" />
        <ActionButton action={Action.STAND} text="Stand" size="big" />
      </div>
      <div className="action-panel-row">
        <ActionButton action={Action.SPLIT} src={`${process.env.PUBLIC_URL}/split.png`} size="small" />
        <ActionButton action={Action.DOUBLE} src={`${process.env.PUBLIC_URL}/double.png`} size="small" />
        <ActionButton action={Action.SURRENDER} src={`${process.env.PUBLIC_URL}/surrender.png`} size="small" />
      </div>
    </div>
  );
};

export default ActionPanel;
