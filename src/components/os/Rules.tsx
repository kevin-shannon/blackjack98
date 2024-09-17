import "./Rules.css";

function Rules() {
  return (
    <div className="window" style={{ display: "inline-block" }}>
      <div className="title-bar">
        <div className="title-bar-text">Rules</div>
        <div className="title-bar-controls"></div>
      </div>
      <div className="window-body">
        <div className="field-row-stacked">
          <label>Number of decks</label>
          <input id="num-of-decks" value="6" />
        </div>
        <div className="field-row">
          <label>Penetration:</label>
          <label>50%</label>
          <input id="penetration" type="range" min="50" max="85" value="75" step="5" />
          <label>85%</label>
        </div>
        <div className="field-row">
          <input type="checkbox" id="das" />
          <label>Double after split</label>
        </div>
        <div className="field-row">
          <input type="checkbox" id="h17" />
          <label>Hit soft 17</label>
        </div>
        <div className="field-row">
          <input type="checkbox" id="resplit-aces" />
          <label>Re-split aces</label>
        </div>
        <div className="field-row">
          <input type="checkbox" id="allow-surrender" />
          <label>Allow Surrender</label>
        </div>
        BlackJack payout
        <select>
          <option>3:2</option>
          <option>6:5</option>
          <option>1:1</option>
        </select>
      </div>
    </div>
  );
}

export default Rules;
