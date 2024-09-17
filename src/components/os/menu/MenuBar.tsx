import "./MenuBar.css";
import MenuBarItem from "./MenuBarItem";
import { useState } from "react";

function MenuBar() {
  const [isGamePopupOpen, setIsGamePopupOpen] = useState(false);
  const [isOptionsPopupOpen, setIsOptionsPopupOpen] = useState(false);
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);

  const openPopup = (popupName: string) => {
    setIsGamePopupOpen(popupName === "Game");
    setIsOptionsPopupOpen(popupName === "Options");
    setIsAboutPopupOpen(popupName === "About");
  };

  const closeAllPopups = () => {
    setIsGamePopupOpen(false);
    setIsOptionsPopupOpen(false);
    setIsAboutPopupOpen(false);
  };

  return (
    <div className="menu-bar">
      <MenuBarItem
        label="Game"
        items={["Basic Strategy", "Running Count", "True Count", "Freeplay"]}
        isPopupOpen={isGamePopupOpen}
        openPopup={() => openPopup("Game")}
        closeAllPopups={closeAllPopups}
      />
      <MenuBarItem
        label="Options"
        items={["Rules", "Settings", "Customization"]}
        isPopupOpen={isOptionsPopupOpen}
        openPopup={() => openPopup("Options")}
        closeAllPopups={closeAllPopups}
      />
      <MenuBarItem label="About" items={["Learn more"]} isPopupOpen={isAboutPopupOpen} openPopup={() => openPopup("About")} closeAllPopups={closeAllPopups} />
    </div>
  );
}

export default MenuBar;
