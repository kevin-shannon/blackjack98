import "./Settings.css";

function Settings() {
  return (
      <div className="window" style={{ display: "inline-block" }}>
        <div className="title-bar">
          <div className="title-bar-text">Settings</div>
          <div className="title-bar-controls"></div>
        </div>
        <div className="window-body">
            <div className="field-row">
            <input type="checkbox" id=""/>
            <label>Timed hands</label>
            </div>
            <div className="field-row">
            <label >Time:</label>
            <label >3s</label>
            <input id="hand-time-limit" type="range" min="3" max="20" value="10"/>
            <label >20s</label>
            </div>
            <div className="field-row">
            <input type="checkbox" id=""/>
            <label>Ask for count</label>
            </div>
            <div className="field-row">
            <label>Interval:</label>
            <label>1</label>
            <input id="hand-time-limit" type="range" min="1" max="10" value="3"/>
            <label>10</label>
            </div>
            <fieldset>
              <div className="field-row">Discard Indicator:</div>
              <div className="field-row">
                <input id="discard-none-radio" type="radio" name="fieldset-example"/>
                <label >None</label>
              </div>
              <div className="field-row">
                <input id="discard-count-radio" type="radio" name="fieldset-example"/>
                <label >Discard Count</label>
              </div>
              <div className="field-row">
                <input id="discard-tray-radio" type="radio" name="fieldset-example"/>
                <label >Discard Tray</label>
              </div>
            </fieldset>
        </div>
      </div>
  );
}

export default Settings;
