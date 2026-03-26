/**
 * File: Navbar.js
 * Description: Fixed top navigation bar. Shows a logout button and the
 *              authenticated username when a session is active, or a
 *              Sign In link when not authenticated.
 * State:
 *   isMenuOpen {boolean} — mobile hamburger menu visibility
 * Used in: App.js (AppLayout)
 */

import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { isLoggedIn, getAuthUser, logout } from "../../services/authService";
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

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const getNavLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const authUser = getAuthUser();
  const userIsLoggedIn = isLoggedIn();

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Brand */}
        <div
          className="navbar-brand"
          onClick={() => navigate("/dashboard")}
          role="link"
          tabIndex={0}
          aria-label="AgriConnect home"
        >
          <div className="brand-icon" aria-hidden="true">
            🌾
          </div>
          <span className="brand-name">AgriConnect</span>
        </div>

        {/* Desktop nav links */}
        <ul className={`navbar-links${isMenuOpen ? " open" : ""}`}>
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className={getNavLinkClass} onClick={closeMenu}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right side — user info + logout OR sign-in */}
        <div className="navbar-right">
          {userIsLoggedIn ? (
            <>
              <span className="navbar-username">
                👤 {authUser?.username ?? "User"}
              </span>
              <button
                className="btn-logout"
                onClick={handleLogout}
                aria-label="Sign out"
              >
                Logout
              </button>
            </>
          ) : (
            <button className="nav-link" onClick={() => navigate("/login")}>
              Sign In
            </button>
          )}

          {/* Hamburger */}
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
