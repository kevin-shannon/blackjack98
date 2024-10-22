import "./MenuBarItem.css";
import MenuPopup from "./MenuPopup";

interface MenuBarItemProps {
  label: string;
  items: string[];
  isPopupOpen: boolean;
  openPopup: () => void;
  closeAllPopups: () => void;
  isAnyPopupOpen: boolean;
}

function MenuBarItem({
  label,
  items,
  isPopupOpen,
  openPopup,
  isAnyPopupOpen,
}: MenuBarItemProps) {
  const handleInteraction = () => {
    openPopup();
  };

  return (
    <div
      className="menu-bar-item"
      onMouseEnter={() => {
        if (isAnyPopupOpen && !isPopupOpen) {
          handleInteraction();
        }
      }}
    >
      <button
        className={`menu-bar-item-button ${isPopupOpen ? "active" : ""}`}
        onMouseDown={handleInteraction}
      >
        <span>{label}</span>
      </button>
      <MenuPopup items={items} isVisible={isPopupOpen} />
    </div>
  );
}

export default MenuBarItem;
