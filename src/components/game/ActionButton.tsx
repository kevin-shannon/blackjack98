import React from "react";
import "./ActionButton.css";
import { Action } from "../../enums";

interface ActionButtonProps {
  action: Action;
  src: string;
  resolveAction: (action: Action) => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, src, resolveAction }) => {
  const handleClick = () => {
    resolveAction(action);
  };

  return (
    <button className="action-button" onClick={handleClick}>
      <img src={src} alt={action} className="action-button-img" />
    </button>
  );
};

export default ActionButton;
