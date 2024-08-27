import React from "react";
import "./ActionButton.css";
import { Action } from "../../enums";

interface ActionButtonProps {
  action: Action;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onClick }) => {
  return (
    <button className="action-button" onClick={onClick}>
      <img src={action.src} alt={action.actionName} className="action-button-img" />
    </button>
  );
};
export default ActionButton;
