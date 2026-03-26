/**
 * File: SchemeDetails.js
 * Description: Displays the full detail view for a single government scheme.
 *              Reads the scheme ID from the URL parameter and looks up
 *              the corresponding scheme via schemeService.
 *              Renders a 404-style "not found" state if the ID is invalid.
 *
 * Props: none (receives `id` via React Router's useParams hook)
 * Used in: App.js (route /scheme/:id)
 */

import React from "react";
import { useParams, Link } from "react-router-dom";
import { getSchemeById } from "../../services/schemeService";
import "./SchemeDetails.css";

function SchemeDetails() {
  const { id } = useParams();

  // Parse the string URL param to an integer for lookup
  const scheme = getSchemeById(parseInt(id, 10));

  // Render a friendly not-found state for invalid / missing scheme IDs
  if (!scheme) {
    return (
      <div className="page-container">
        <div className="not-found">
          <span>⚠️</span>
          <h2>Scheme Not Found</h2>
          <p>The scheme you are looking for does not exist.</p>
          <Link to="/schemes" className="btn-primary">
            ← Back to Schemes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/schemes" className="back-link">
        ← All Schemes
      </Link>

      <div className="scheme-detail-card animate-fade-in">
        <div className="scheme-detail-badge">
          <span className="badge badge-green">Scheme #{scheme.id}</span>
        </div>

        <h1 className="scheme-detail-title">{scheme.title}</h1>
        <div className="divider" />

        <div className="scheme-detail-body">
          <h3>Overview</h3>
          <p>{scheme.description}</p>

          <h3>Eligibility</h3>
          <p>
            All Indian farmers registered with their respective state
            agriculture departments are eligible to apply.
          </p>

          <h3>Benefits</h3>
          <ul>
            <li>Financial assistance and subsidies</li>
            <li>Technical support and guidance</li>
            <li>Access to modern farming infrastructure</li>
          </ul>

          <h3>How to Apply</h3>
          <p>
            Visit your nearest Kisan Seva Kendra or apply online at the PM‑Kisan
            portal with your Aadhaar and bank account details.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SchemeDetails;
