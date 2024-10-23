import React from "react";
import "./ActionButton.css";
import { Action } from "../../enums";

interface ActionButtonProps {
  action: Action;
  src?: string;
  size: string;
  text?: string;
}

const ActionButton = ({ action, src, size, text }: ActionButtonProps) => {
  return (
    <button className={`action-button ${size}`}>
      {text ? (
        <span className="action-button-text">{text}</span>
      ) : (
        <img
          id={`${action}-button`}
          src={src}
          alt={action}
          className="action-button-img"
          draggable="false"
        />
      )}
    </button>
  );
};

export default ActionButton;

