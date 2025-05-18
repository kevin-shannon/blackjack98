import "./Content.css";
import "98.css";
import Game from "./Game";
import { GameMode } from "../../enums";
import StartMenu from "./StartMenu";

interface ContentProps {
  gameMode: GameMode,
}

function Content({ gameMode }: ContentProps) {
    return (
        gameMode === GameMode.START ? <StartMenu /> : <Game gameMode={gameMode} />
    )
    ;
}

export default Content;
