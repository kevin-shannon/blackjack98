import "./MenuBar.css";

function MenuBar() {
  return (
    <div className="menu-bar">
      <div className="menu-bar-item" onClick={() => 2}>
        <span>Game</span>
      </div>
      <div className="menu-bar-item" onClick={() => 2}>
        <span>Rules</span>
      </div>
      <div className="menu-bar-item" onClick={() => 2}>
        <span>Options</span>
      </div>
      <div className="menu-bar-item" onClick={() => 2}>
        <span>About</span>
      </div>
    </div>
  );
}

export default MenuBar;
