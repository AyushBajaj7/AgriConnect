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

const STATUS_LABELS = {
  ongoing: "Ongoing",
  upcoming: "Upcoming",
  completed: "Completed",
};

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
        Back to schemes
      </Link>

      <div className="scheme-detail-card animate-fade-in">
        <div className="scheme-detail-badge">
          <span className={`scheme-status-badge badge-${scheme.status}`}>
            {STATUS_LABELS[scheme.status] ?? "Scheme"}
          </span>
        </div>

        <h1 className="scheme-detail-title">{scheme.title}</h1>
        <div className="divider" />

        <div className="scheme-detail-grid">
          <div className="scheme-detail-metric">
            <span className="scheme-detail-label">Ministry</span>
            <span>{scheme.ministry ?? "Not specified"}</span>
          </div>
          <div className="scheme-detail-metric">
            <span className="scheme-detail-label">Budget</span>
            <span>{scheme.budget ?? "Not specified"}</span>
          </div>
          <div className="scheme-detail-metric">
            <span className="scheme-detail-label">Deadline</span>
            <span>{scheme.deadline ?? "Not specified"}</span>
          </div>
          <div className="scheme-detail-metric">
            <span className="scheme-detail-label">Beneficiaries</span>
            <span>{scheme.beneficiaries ?? "Varies by scheme"}</span>
          </div>
        </div>

        <div className="info-banner">
          <div className="info-banner-title">Verify before applying</div>
          <div className="info-banner-text">
            This page is a structured reference summary. Always confirm the
            latest rules, dates, and required documents on the official scheme
            portal before making a decision.
          </div>
        </div>

        <div className="scheme-detail-body">
          <h3>Overview</h3>
          <p>{scheme.description}</p>

          <h3>Eligibility</h3>
          <p>
            Eligibility depends on the scheme, state, beneficiary category,
            landholding type, and supporting documents. Use the official scheme
            rules to confirm whether the program applies to your farm or
            organization.
          </p>

          <h3>How to Apply</h3>
          <p>
            Follow the official application route published for this scheme.
            Depending on the program, that may mean an online central portal, a
            state agriculture department site, a district office, or an
            assisted application through a local service center.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SchemeDetails;
