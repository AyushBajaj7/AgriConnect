/**
 * File: Card.js
 * Description: Reusable card component used across the dashboard and other
 *              pages to display a labelled block of information with an
 *              optional icon, badge, value, subtitle, and child content.
 *
 * Props:
 *   icon     {string}   — Emoji or text displayed at the top of the card
 *   title    {string}   — Bold heading
 *   value    {string}   — Large numeric or text value (stat cards)
 *   subtitle {string}   — Muted supporting text
 *   badge    {{ label: string, color: 'green' | 'gold' | 'blue' }} — Small status badge
 *   onClick  {Function} — If provided, makes the card interactive (adds 'clickable' class)
 *   children {ReactNode}— Slot for arbitrary child content
 *
 * Used in: pages/Dashboard/Dashboard.js
 */

import React from "react";
import "./Card.css";

function Card({ icon, title, value, subtitle, badge, onClick, children }) {
  const isClickable = typeof onClick === "function";

  return (
    <div
      className={`card-component${isClickable ? " clickable" : ""}`}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {icon && <div className="card-icon">{icon}</div>}
      {badge && (
        <span className={`badge badge-${badge.color ?? "green"}`}>
          {badge.label}
        </span>
      )}
      {title && <h3 className="card-title">{title}</h3>}
      {value && <p className="card-value">{value}</p>}
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}

export default Card;
