import "./MenuBar.css";
import MenuBarItem from "./MenuBarItem";
import { useState, useEffect, useRef } from "react";

function MenuBar() {
  const [isGamePopupOpen, setIsGamePopupOpen] = useState(false);
  const [isOptionsPopupOpen, setIsOptionsPopupOpen] = useState(false);
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const openPopup = (popupName: string) => {
    if (popupName === "Game") {
      setIsGamePopupOpen(!isGamePopupOpen); // Toggle for Game
      setIsOptionsPopupOpen(false);
      setIsAboutPopupOpen(false);
    } else if (popupName === "Options") {
      setIsOptionsPopupOpen(!isOptionsPopupOpen); // Toggle for Options
      setIsGamePopupOpen(false);
      setIsAboutPopupOpen(false);
    } else if (popupName === "About") {
      setIsAboutPopupOpen(!isAboutPopupOpen); // Toggle for About
      setIsGamePopupOpen(false);
      setIsOptionsPopupOpen(false);
    }
  };

  const closeAllPopups = () => {
    setIsGamePopupOpen(false);
    setIsOptionsPopupOpen(false);
    setIsAboutPopupOpen(false);
  };

  const isAnyPopupOpen = isGamePopupOpen || isOptionsPopupOpen || isAboutPopupOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeAllPopups();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="menu-bar" ref={menuRef}>
      <MenuBarItem
        label="Game"
        items={["Basic Strategy", "Running Count", "True Count", "Freeplay"]}
        isPopupOpen={isGamePopupOpen}
        openPopup={() => openPopup("Game")}
        closeAllPopups={closeAllPopups}
        isAnyPopupOpen={isAnyPopupOpen}
      />
      <MenuBarItem
        label="Options"
        items={["Rules", "Settings", "Customization"]}
        isPopupOpen={isOptionsPopupOpen}
        openPopup={() => openPopup("Options")}
        closeAllPopups={closeAllPopups}
        isAnyPopupOpen={isAnyPopupOpen}
      />
      <MenuBarItem
        label="About"
        items={["Learn more"]}
        isPopupOpen={isAboutPopupOpen}
        openPopup={() => openPopup("About")}
        closeAllPopups={closeAllPopups}
        isAnyPopupOpen={isAnyPopupOpen}
      />
    </div>
  );
}

export default MenuBar;
