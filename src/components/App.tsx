import "./App.css";
import "98.css";
import Game from "./game/Game";
import MenuBar from "./MenuBar";
import Rules from "./Rules";
import Settings from "./Settings"

function App() {
  return (
    <div className="App">
      <div className="window" style={{ display: "inline-block" }}>
        <div className="title-bar">
          <div className="title-bar-text">BlackJack98</div>
          <div className="title-bar-controls"></div>
        </div>
        <MenuBar />
        <div className="window-body" style={{ margin: "0 8px 8px 8px" }}>
          <Game />
        </div>
        <div className="status-bar">
          <p className="status-bar-field">Press F1 for help</p>
          <p className="status-bar-field">Slide 1</p>
          <p className="status-bar-field">CPU Usage: 14%</p>
        </div>
      </div>
      <Rules/>
      <Settings/>
    </div>
  );
}

export default App;
