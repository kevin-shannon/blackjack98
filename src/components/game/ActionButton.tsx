import React from "react";
import "./ActionButton.css";
import { Action } from "../../enums";

interface ActionButtonProps {
  action: Action;
  src: string;
}

const ActionButton = ({ action, src }: ActionButtonProps) => {
  return (
    <button className="action-button">
      <img id={`${action}-button`} src={src} alt={action} className="action-button-img" />
    </button>
  );
};

export default ActionButton;
