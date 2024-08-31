import React from "react";
import "./ActionPanel.css";
import "98.css";
import { Action } from "../../enums";
import ActionButton from "./ActionButton";

const ActionPanel = () => {
  return (
    <div className="action-panel">
      <div className="action-panel-row">
        <ActionButton action={Action.DOUBLE} src={`${process.env.PUBLIC_URL}/double.png`} />
        <ActionButton action={Action.SURRENDER} src={`${process.env.PUBLIC_URL}/surrender.png`} />
      </div>
      <div className="action-panel-row">
        <ActionButton action={Action.HIT} src={`${process.env.PUBLIC_URL}/hit.png`} />
        <ActionButton action={Action.SPLIT} src={`${process.env.PUBLIC_URL}/split.png`} />
      </div>
      <div className="action-panel-row">
        <ActionButton action={Action.STAND} src={`${process.env.PUBLIC_URL}/stand.png`} />
        <ActionButton action={Action.INSURANCE} src={`${process.env.PUBLIC_URL}/insurance.png`} />
      </div>
    </div>
  );
};

export default ActionPanel;
