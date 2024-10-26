import { useContext } from 'react';
import { GameMode } from "../../../enums";
import { GameModeContext } from "../../../context/GameModeContext";
import "./MenuBarItem.css";
import MenuPopup from "./MenuPopup";

interface MenuBarItemProps {
  label: string;
  items: string[];
  isPopupOpen: boolean;
  openPopup: () => void;
  isAnyPopupOpen: boolean;
}

function MenuBarItem({
  label,
  items,
  isPopupOpen,
  openPopup,
  isAnyPopupOpen,
}: MenuBarItemProps) {

  // Call useContext only once in the component body
  const setGameMode = useContext(GameModeContext);

  // Use the setGameMode in the handler
  const HandleItemClick = (item: string) => {
    setGameMode(item as GameMode);  // Set the game mode
  };

  return (
    <div
      className="menu-bar-item"
      onMouseEnter={() => {
        if (isAnyPopupOpen && !isPopupOpen) {
          openPopup();
        }
      }}
    >
      <button
        className={`menu-bar-item-button ${isPopupOpen ? "active" : ""}`}
        onMouseDown={openPopup}
      >
        <span>{label}</span>
      </button>
      <MenuPopup items={items} isVisible={isPopupOpen} onItemClick={HandleItemClick} />
    </div>
  );
}

export default MenuBarItem;

