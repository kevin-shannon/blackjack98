import "./App.css";
import "98.css";
import Game from "./game/Game";
import MenuBar from "./os/menu/MenuBar";
import Rules from "./os/Rules";
import Settings from "./os/Settings";
import { GameMode } from "../enums";
import { useState } from "react";
import { GameModeContext } from '../context/GameModeContext';

function App() {
  const [gameMode, setGameMode] = useState(GameMode.BASIC);
  const [userSettings, setUserSettings] = useState([]);

  console.log(gameMode)

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
          <Game gameMode={gameMode} />
        </div>
      </div>
      <Rules />
      <Settings />
    </div>
  );
}

export default App;
