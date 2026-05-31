/**
 * File: Navbar.js
 * Description: Fixed top navigation bar for authenticated application routes.
 *              On mobile, renders a separate bottom tab bar outside the top
 *              navbar to avoid backdrop-filter containment issues.
 * Used in: App.js (AppLayout)
 */

import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/schemes", label: "Schemes" },
  { to: "/crop-prices", label: "Prices" },
  { to: "/tools", label: "Tools" },
  { to: "/weather", label: "Weather" },
];

function Navbar() {
  const navigate = useNavigate();
  const { authUser, signOut } = useAuth();

  const getNavLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const linkItems = NAV_LINKS.map(({ to, label }) => (
    <li key={to}>
      <NavLink to={to} className={getNavLinkClass}>
        {label}
      </NavLink>
    </li>
  ));

  return (
    <>
      {/* ── Top navbar (brand + desktop links + logout) ── */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          <Link
            className="navbar-brand"
            to="/dashboard"
            aria-label="AgriConnect home"
          >
            <div className="brand-icon" aria-hidden="true">
              AG
            </div>
            <span className="brand-name">AgriConnect</span>
          </Link>

          {/* Desktop-only links (hidden on mobile via CSS) */}
          <ul className="navbar-links-desktop">
            {linkItems}
          </ul>

          <div className="navbar-right">
            <span className="navbar-username">
              {authUser?.username ?? "Authenticated user"}
            </span>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Bottom tab bar for mobile (outside <nav> to avoid backdrop-filter containment) ── */}
      <ul className="navbar-bottom-mobile" aria-label="Mobile navigation">
        {linkItems}
      </ul>
    </>
  );
}

export default Navbar;
