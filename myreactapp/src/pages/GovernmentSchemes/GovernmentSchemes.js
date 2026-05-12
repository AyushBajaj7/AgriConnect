import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchSchemeReviewLog,
  getAllSchemes,
  SCHEME_STATUSES,
} from "../../services/schemeService";
import "./GovernmentSchemes.css";

const STATUS_LABELS = {
  all: "All schemes",
  ongoing: "Currently open",
  upcoming: "Coming soon",
  completed: "Closed or completed",
};

function GovernmentSchemes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [reviewLog, setReviewLog] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(true);

  const allSchemes = getAllSchemes();

  useEffect(() => {
    let mounted = true;

    async function loadReviewLog() {
      setReviewLoading(true);
      const result = await fetchSchemeReviewLog();
      if (!mounted) return;

      setReviewLog(result.log);
      setReviewError(result.ok ? "" : result.error);
      setReviewLoading(false);
    }

    loadReviewLog();
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const result = { all: allSchemes.length, ongoing: 0, upcoming: 0, completed: 0 };
    allSchemes.forEach((scheme) => {
      result[scheme.status] = (result[scheme.status] ?? 0) + 1;
    });
    return result;
  }, [allSchemes]);

  const filtered = allSchemes.filter((scheme) => {
    const query = searchQuery.toLowerCase();
    const matchStatus = activeStatus === "all" || scheme.status === activeStatus;
    const matchSearch =
      !query ||
      scheme.title.toLowerCase().includes(query) ||
      scheme.ministry?.toLowerCase().includes(query) ||
      scheme.coverageType?.toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Government Schemes</h1>
      <p className="page-subtitle">
        Search reviewed agriculture schemes, check the last review date, and
        open official government sources before applying.
      </p>

      <div className="info-banner">
        <div className="info-banner-title">Reviewed reference directory</div>
        <div className="info-banner-text">
          Government schemes do not have one reliable real-time API for every
          central and state update. AgriConnect keeps a local reviewed directory
          and flags records for checking through official government links.
        </div>
        <div className="scheme-review-status">
          {reviewLoading
            ? "Checking official portals..."
            : reviewLog?.lastRunAt
              ? `Official portal check: ${new Date(
                  reviewLog.lastRunAt,
                ).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}`
              : "Official portal check is not available."}
          {reviewError && ` ${reviewError}`}
        </div>
      </div>

      <div className="schemes-status-tabs" aria-label="Scheme status filters">
        {SCHEME_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`scheme-status-tab scheme-status-tab-${status}${
              activeStatus === status ? " active" : ""
            }`}
            onClick={() => setActiveStatus(status)}
          >
            {STATUS_LABELS[status]}
            <span className="scheme-tab-count">{counts[status] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="schemes-search-bar">
        <input
          type="text"
          id="scheme-search"
          name="scheme-search"
          placeholder="Search scheme, ministry, or support type"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search government schemes"
          autoComplete="off"
        />
      </div>

      <div className="schemes-count">
        Showing <strong>{filtered.length}</strong> of {allSchemes.length} schemes
      </div>

      {filtered.length > 0 ? (
        <ul className="schemes-list">
          {filtered.map((scheme, index) => (
            <li
              key={scheme.id}
              className="scheme-item animate-fade-in"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="scheme-left">
                <div className="scheme-number">Scheme {scheme.id}</div>
                <span className={`scheme-status-badge badge-${scheme.status}`}>
                  {STATUS_LABELS[scheme.status]}
                </span>
              </div>

              <div className="scheme-content">
                <Link to={`/scheme/${scheme.id}`} className="scheme-title">
                  {scheme.title}
                </Link>
                <p className="scheme-desc">{scheme.description}</p>
                <div className="scheme-meta">
                  {scheme.ministry && (
                    <span className="scheme-ministry">Ministry: {scheme.ministry}</span>
                  )}
                  {scheme.budget && (
                    <span className="scheme-budget">Budget: {scheme.budget}</span>
                  )}
                  {scheme.deadline && (
                    <span className="scheme-deadline">Deadline: {scheme.deadline}</span>
                  )}
                  <span className="scheme-deadline">
                    Last reviewed: {scheme.lastReviewed}
                  </span>
                </div>
              </div>

              <Link to={`/scheme/${scheme.id}`} className="btn-secondary scheme-cta">
                View details
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-results">
          <p>
            No schemes found for "<strong>{searchQuery}</strong>"
          </p>
        </div>
      )}
    </div>
  );
}

export default GovernmentSchemes;
