import "./App.css";
import "98.css";
import Game from "./game/Game";

function App() {
  return (
    <div className="App">
      <div className="window" style={{ display: "inline-block" }}>
        <div className="title-bar">
          <div className="title-bar-text">BlackJack</div>
          <div className="title-bar-controls"></div>
        </div>
        <div className="window-body">
          <Game />
        </div>
        <div className="status-bar">
          <p className="status-bar-field">Press F1 for help</p>
          <p className="status-bar-field">Slide 1</p>
          <p className="status-bar-field">CPU Usage: 14%</p>
        </div>
      </div>
    </div>
  );
}

export default App;
