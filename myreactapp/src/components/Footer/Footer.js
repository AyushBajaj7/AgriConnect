/**
 * File: Footer.js
 * Description: Site-wide footer component. Displays the AgriConnect brand,
 *              a two-column navigation link grid, and a copyright notice.
 *              Automatically shows the current year.
 *
 * Props: none
 * Used in: App.js (AppLayout — renders on every page except /login)
 */

import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

/** Navigation columns shown in the footer link area. */
const FOOTER_NAV = [
  {
    heading: "Platform",
    links: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Gov. Schemes", to: "/schemes" },
      { label: "Crop Prices", to: "/crop-prices" },
    ],
  },
  {
    heading: "Tools",
    links: [
      { label: "Farming Tools", to: "/tools" },
      { label: "Weather", to: "/weather" },
    ],
  },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand block */}
        <div className="footer-brand">
          <span className="footer-icon">🌾</span>
          <div>
            <p className="footer-name">AgriConnect</p>
            <p className="footer-tagline">
              Connecting Farmers, Growing Futures
            </p>
          </div>
        </div>

        {/* Navigation columns */}
        <div className="footer-links">
          {FOOTER_NAV.map(({ heading, links }) => (
            <div key={heading} className="footer-col">
              <h4>{heading}</h4>
              {links.map(({ label, to }) => (
                <Link key={to} to={to}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} AgriConnect. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
