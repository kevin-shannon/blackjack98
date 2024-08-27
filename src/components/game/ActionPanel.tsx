import "./ActionPanel.css";
import "98.css";
import { actions } from "../../enums";
import ActionButton from "./ActionButton";

function ActionPanel() {
  return (
    <div className="action-panel">
      <div className="action-panel-row">
        <div className="action-panel">
          <div className="action-panel-row">
            <ActionButton action={actions[0]} />
            <ActionButton action={actions[1]} />
          </div>
          <div className="action-panel-row">
            <ActionButton action={actions[2]} />
            <ActionButton action={actions[3]} />
          </div>
          <div className="action-panel-row">
            <ActionButton action={actions[4]} />
            <ActionButton action={actions[5]} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionPanel;
