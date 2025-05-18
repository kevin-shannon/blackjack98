import MenuPopupItem from "./MenuPopupItem";
import { GameMode } from "../../../enums";
import "./MenuPopup.css";

interface MenuPopupProps {
  items: string[];
  isVisible: boolean;
  onItemClick: (item: string) => void;
}

function MenuPopup({ items, isVisible, onItemClick }: MenuPopupProps) {
  if (!isVisible) return null;

  return (
    <div className="menu-popup window">
      <div className="menu-items">
        {items.map((item, index) => (
          <MenuPopupItem key={index} item={item} onClick={() => onItemClick(item)} />
        ))}
      </div>
    </div>
  );
}

export default MenuPopup;
