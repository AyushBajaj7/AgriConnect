/**
 * File: Navbar.js
 * Description: Fixed top navigation bar for authenticated application routes.
 * State:
 *   isMenuOpen {boolean} — mobile hamburger menu visibility
 * Used in: App.js (AppLayout)
 */

import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/schemes", label: "Schemes" },
  { to: "/crop-prices", label: "Crop Prices" },
  { to: "/tools", label: "Tools" },
  { to: "/weather", label: "Weather" },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { authUser, signOut } = useAuth();

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const getNavLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const handleLogout = async () => {
    await signOut();
    closeMenu();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link
          className="navbar-brand"
          to="/dashboard"
          aria-label="AgriConnect home"
          onClick={closeMenu}
        >
          <div className="brand-icon" aria-hidden="true">
            AG
          </div>
          <span className="brand-name">AgriConnect</span>
        </Link>

        <ul className={`navbar-links${isMenuOpen ? " open" : ""}`}>
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className={getNavLinkClass} onClick={closeMenu}>
                {label}
              </NavLink>
            </li>
          ))}
          <li className="navbar-mobile-action">
            <button className="nav-link nav-link-button" onClick={handleLogout}>
              Sign out
            </button>
          </li>
        </ul>

        <div className="navbar-right">
          <span className="navbar-username">
            {authUser?.username ?? "Authenticated user"}
          </span>
          <button className="btn-logout" onClick={handleLogout}>
            Sign out
          </button>
          <button
            className="hamburger"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
