import { Link } from "react-router-dom";
import "../css/NavBar.css";

function NavBar() {
  return (
    <nav className="navbar">
      <Link className="navbar-title" to="/">
        <img
          src="https://elim-bruxelles.com/wp-content/uploads/2025/05/logomi-100x100-1.png"
          alt="Logo of a bird"
        />
      </Link>
      <div className="navbar-links">
        <Link to="/" className="link">
          Lista Oficiala
        </Link>
        <Link to="/addsong">
          <button className="addsong-btn">Adauga Cantare</button>
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
