import "./MenuItem.css";

interface MenuItemProps {
  item: string;
}

function MenuItem({ item }: MenuItemProps) {
  return (
    <div className="menu-popup-item">
      <span>{item}</span>
    </div>
  );
}

export default MenuItem;
