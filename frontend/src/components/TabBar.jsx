import { NavLink } from "react-router-dom";
import "../css/TabBar.css";

function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Navigare principală">
      <div className="tab-bar-inner">
        <NavLink to="/" end className="tab">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-icon">
            <path d="M9 18.5a2.5 2.5 0 1 1-2.5-2.5c.53 0 1.02.16 1.42.44V5.2l11-2.2v12.5a2.5 2.5 0 1 1-2.5-2.5c.53 0 1.02.16 1.42.44V6.66L9.42 8.27V18.5H9z" />
          </svg>
          <span>Listă</span>
        </NavLink>
        <NavLink to="/sub-liste" className="tab">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-icon">
            <path d="M8 2h2v2h4V2h2v2h3a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2zM5 10v9h14v-9H5zm0-2h14V6H5v2zm2 4h4v4H7v-4z" />
          </svg>
          <span>Sub-liste</span>
        </NavLink>
        <NavLink to="/addsong" className="tab">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-icon">
            <path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z" />
          </svg>
          <span>Adaugă</span>
        </NavLink>
      </div>
    </nav>
  );
}

export default TabBar;
