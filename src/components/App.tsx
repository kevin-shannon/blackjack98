import "./App.css";
import "98.css";
import Content from "./game/Content";
import MenuBar from "./os/menu/MenuBar";
import { GameMode } from "../enums";
import { useState } from "react";
import { GameModeContext } from "../context/GameModeContext";

function App() {
  const [gameMode, setGameMode] = useState(GameMode.START);
  const [userSettings, setUserSettings] = useState([]);

  console.log(gameMode);

  return (
    <div className="App">
      <div className="window" style={{ display: "inline-block" }}>
        <div className="title-bar">
          <div className="title-bar-text">BlackJack98</div>
          <div className="title-bar-controls"></div>
        </div>
        <GameModeContext.Provider value={setGameMode}>
          <MenuBar />
        </GameModeContext.Provider>
        <div className="window-body" style={{ margin: "0 8px 8px 8px" }}>
          <Content gameMode={gameMode} />
        </div>
      </div>
    </div>
  );
}

export default App;
