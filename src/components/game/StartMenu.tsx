import "./StartMenu.css";
import "98.css";

function StartMenu() {
    return (
        <div className="startmenu-items" style={{ width: 640, height: 480, backgroundColor: "var(--primary-jade)" }}>
          <button>Basic</button>
          <button>Train</button>
          <button>Free</button>
        </div>
      );
}

export default StartMenu;