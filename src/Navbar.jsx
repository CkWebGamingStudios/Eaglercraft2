import { Link } from "react-router-dom";
import "./pages/home.css";

export default function Navbar({ onSignOut }) {
  return (
    <header className="topbar">
      <div className="brand">EAGLERCRAFT2</div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/store">Store</Link>
        <Link to="/forums">Forums</Link>
        <Link to="/settings">Settings</Link>
        <a href="#">Docs</a>
        <a href="#">Mods</a>
        <a href="#">Clips</a>
      </nav>
      <button className="cta">Launch</button>
      <button className="cta ghost" type="button" onClick={onSignOut}>
        Sign Out
      </button>
    </header>
  );
}
