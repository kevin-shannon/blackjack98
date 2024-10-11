import "./MenuBarItem.css";
import MenuPopup from "./MenuPopup";

interface MenuBarItemProps {
  label: string;
  items: string[];
  isPopupOpen: boolean;
  openPopup: () => void;
  closeAllPopups: () => void;
}

function MenuBarItem({ label, items, isPopupOpen, openPopup }: MenuBarItemProps) {
  const handleClick = () => {
    openPopup();
  };

  return (
    <div className="menu-bar-item">
      <div className="menu-bar-item-button" onClick={handleClick}>
        <span>{label}</span>
      </div>
      <MenuPopup items={items} isVisible={isPopupOpen} />
    </div>
  );
}

export default MenuBarItem;
