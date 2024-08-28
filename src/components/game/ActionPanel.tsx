import React from "react";
import "./ActionPanel.css";
import "98.css";
import { Action } from "../../enums";
import ActionButton from "./ActionButton";

interface ActionPanelProps {
  resolveAction: (action: Action) => void;
}

const ActionPanel = ({ resolveAction }: ActionPanelProps) => {
  return (
    <div className="action-panel">
      <div className="action-panel-row">
        <ActionButton action={Action.DOUBLE} src={"2x.png"} resolveAction={resolveAction} />
        <ActionButton action={Action.SURRENDER} src={"surrender.png"} resolveAction={resolveAction} />
      </div>
      <div className="action-panel-row">
        <ActionButton action={Action.HIT} src={"hit.png"} resolveAction={resolveAction} />
        <ActionButton action={Action.SPLIT} src={"split.png"} resolveAction={resolveAction} />
      </div>
      <div className="action-panel-row">
        <ActionButton action={Action.STAND} src={"stand.png"} resolveAction={resolveAction} />
        <ActionButton action={Action.INSURANCE} src={"insurance.png"} resolveAction={resolveAction} />
      </div>
    </div>
  );
};

export default ActionPanel;
