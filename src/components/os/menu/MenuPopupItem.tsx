import "./MenuPopupItem.css";

interface MenuItemProps {
  item: string;
  onClick: () => void;
}

function MenuPopupItem({ item, onClick }: MenuItemProps) {
  return (
    <div className="menu-popup-item" onClick={onClick}>
      <span>{item}</span>
    </div>
  );
}

export default MenuPopupItem;
