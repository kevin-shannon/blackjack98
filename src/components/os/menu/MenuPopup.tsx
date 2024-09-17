import MenuItem from "./MenuItem";
import "./MenuPopup.css";

interface MenuPopupProps {
  items: string[];
  isVisible: boolean;
}

function MenuPopup({ items, isVisible }: MenuPopupProps) {
  if (!isVisible) return null;

  return (
    <div className="menu-popup window">
      <ul className="menu-items">
        {items.map((item, index) => (
          <MenuItem item={item} />
        ))}
      </ul>
    </div>
  );
}

export default MenuPopup;
