import React from "react";
import { Link, useParams } from "react-router-dom";
import { getSchemeById } from "../../services/schemeService";
import "./SchemeDetails.css";

const STATUS_LABELS = {
  ongoing: "Currently open",
  upcoming: "Coming soon",
  completed: "Closed or completed",
};

function SchemeDetails() {
  const { id } = useParams();
  const scheme = getSchemeById(parseInt(id, 10));

  if (!scheme) {
    return (
      <div className="page-container">
        <div className="not-found">
          <h2>Scheme Not Found</h2>
          <p>The scheme you are looking for does not exist.</p>
          <Link to="/schemes" className="btn-primary">
            Back to Schemes
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
          <div className="scheme-detail-metric">
            <span className="scheme-detail-label">Last reviewed</span>
            <span>{scheme.lastReviewed ?? "Review pending"}</span>
          </div>
          <div className="scheme-detail-metric">
            <span className="scheme-detail-label">Support type</span>
            <span>{scheme.coverageType ?? "Agriculture support"}</span>
          </div>
        </div>

        <div className="info-banner">
          <div className="info-banner-title">Verify before applying</div>
          <div className="info-banner-text">
            This page is a reviewed reference summary. Always confirm the latest
            rules, dates, and required documents on the official scheme portal
            before applying.
          </div>
        </div>

        <div className="scheme-detail-body">
          <h3>Overview</h3>
          <p>{scheme.description}</p>

          <h3>Eligibility</h3>
          <p>
            Eligibility depends on the scheme, state, beneficiary category,
            landholding type, and supporting documents. Use the official rules
            to confirm whether the program applies to your farm or organization.
          </p>

          <h3>How to apply</h3>
          <p>
            Follow the official application route published for this scheme.
            Depending on the program, that may mean an online central portal, a
            state agriculture department site, a district office, or assisted
            application through a local service center.
          </p>

          <h3>Official source</h3>
          <p>
            Review status: {scheme.reviewStatus ?? "Review link before applying"}.
          </p>
          <a
            className="btn-primary"
            href={scheme.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open official source
          </a>
        </div>
      </div>
    </div>
  );
}

export default SchemeDetails;
