/**
 * File: GovernmentSchemes.js
 * Description: Searchable, filterable list of 35 government schemes.
 *              Status tabs (All / Ongoing / Upcoming / Completed) show counts.
 *              Ongoing schemes always appear first per status sort in schemeService.
 * Used in: App.js (route /schemes)
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllSchemes, SCHEME_STATUSES } from '../../services/schemeService';
import './GovernmentSchemes.css';

const STATUS_LABELS = {
  all: 'All', ongoing: 'Ongoing', upcoming: 'Upcoming', completed: 'Completed',
};
const STATUS_ICONS = {
  ongoing: '🟢', upcoming: '🔵', completed: '⚪',
};

function GovernmentSchemes() {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeStatus,   setActiveStatus]   = useState('all');

  const allSchemes = getAllSchemes();

  // Status counts for tab badges
  const counts = useMemo(() => {
    const c = { all: allSchemes.length, ongoing: 0, upcoming: 0, completed: 0 };
    allSchemes.forEach(s => { c[s.status] = (c[s.status] ?? 0) + 1; });
    return c;
  }, [allSchemes]);

  const filtered = allSchemes.filter(s => {
    const matchStatus = activeStatus === 'all' || s.status === activeStatus;
    const matchSearch = !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ministry?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="page-container">
      <h1 className="page-title">🏛️ Government Schemes</h1>
      <p className="page-subtitle">
        Explore active, upcoming, and completed central &amp; state agricultural schemes. Ongoing schemes are listed first.
      </p>

      {/* Status filter tabs */}
      <div className="schemes-status-tabs">
        {SCHEME_STATUSES.map(status => (
          <button
            key={status}
            className={`scheme-status-tab scheme-status-tab-${status}${activeStatus === status ? ' active' : ''}`}
            onClick={() => setActiveStatus(status)}
          >
            {STATUS_ICONS[status] ?? '📋'} {STATUS_LABELS[status]}
            <span className="scheme-tab-count">{counts[status] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="schemes-search-bar">
        <input
          type="text"
          placeholder="🔍 Search by scheme name or ministry…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search government schemes"
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
                <div className="scheme-number">#{scheme.id}</div>
                <span className={`scheme-status-badge badge-${scheme.status}`}>
                  {STATUS_ICONS[scheme.status]} {STATUS_LABELS[scheme.status]}
                </span>
              </div>

              <div className="scheme-content">
                <Link to={`/scheme/${scheme.id}`} className="scheme-title">
                  {scheme.title}
                </Link>
                <p className="scheme-desc">{scheme.description}</p>
                <div className="scheme-meta">
                  {scheme.ministry && (
                    <span className="scheme-ministry">🏛️ {scheme.ministry}</span>
                  )}
                  {scheme.budget && (
                    <span className="scheme-budget">💰 {scheme.budget}</span>
                  )}
                  {scheme.deadline && (
                    <span className="scheme-deadline">📅 {scheme.deadline}</span>
                  )}
                </div>
              </div>

              <Link to={`/scheme/${scheme.id}`} className="btn-secondary scheme-cta">
                Details →
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-results">
          <p>No schemes found for "<strong>{searchQuery}</strong>"</p>
        </div>
      )}
    </div>
  );
}

export default GovernmentSchemes;
