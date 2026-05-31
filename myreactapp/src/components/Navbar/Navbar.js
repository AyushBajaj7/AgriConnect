/**
 * File: Navbar.js
 * Description: Fixed top navigation bar for authenticated application routes.
 * State:
 *   showNavbar {boolean} — toggle visibility on scroll
 * Used in: App.js (AppLayout)
 */

import React, { useState, useEffect } from "react";
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
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide navbar if scrolled down past 60px
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const getNavLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <nav className={`navbar ${showNavbar ? "" : "navbar-hidden"}`} role="navigation" aria-label="Main navigation">
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

        <ul className="navbar-links">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className={getNavLinkClass}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar-right">
          <span className="navbar-username">
            {authUser?.username ?? "Authenticated user"}
          </span>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            <span className="logout-text">Sign out</span>
            <span className="logout-icon" aria-hidden="true">🚪</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
