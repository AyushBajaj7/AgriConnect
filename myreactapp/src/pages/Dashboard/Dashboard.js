/**
 * File: Dashboard.js
 * Description: Landing page after login. Displays a welcome hero section,
 *              a four-stat summary bar, and a grid of quick-access cards
 *              linking to each major feature of AgriConnect.
 *
 * Props: none
 * State: none (pure presentational — all data is static)
 * Used in: App.js (route /dashboard)
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card/Card";
import "./Dashboard.css";

/**
 * Summary statistics shown in the top stats bar.
 * Update values if the underlying data-set changes.
 */
const SUMMARY_STATS = [
  { label: "Active Schemes", value: "25+", icon: "🏛️" },
  { label: "Crop Categories", value: "5", icon: "🌾" },
  { label: "Tool Listings", value: "7", icon: "🚜" },
  { label: "States Covered", value: "All", icon: "📍" },
];

/**
 * Feature cards displayed in the quick-access grid.
 * Each card links to a primary feature page.
 */
const FEATURE_CARDS = [
  {
    icon: "🏛️",
    title: "Government Schemes",
    subtitle:
      "25 active schemes for farmers including PM-KUSUM, PMFBY and more.",
    badge: { label: "25 Schemes", color: "green" },
    path: "/schemes",
  },
  {
    icon: "📈",
    title: "Crop Prices",
    subtitle: "Live market prices for seeds, vegetables, fruits and crops.",
    badge: { label: "Live Data", color: "gold" },
    path: "/crop-prices",
  },
  {
    icon: "🚜",
    title: "Farming Tools",
    subtitle: "Browse tractors, harvesters, irrigation systems and more.",
    badge: { label: "7 Tools", color: "blue" },
    path: "/tools",
  },
  {
    icon: "🌤️",
    title: "Weather Report",
    subtitle:
      "Live weather data by city or GPS. Temperature, humidity, wind speed.",
    badge: { label: "API Live", color: "gold" },
    path: "/weather",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      {/* ── Hero / welcome banner ── */}
      <div className="dashboard-hero animate-fade-in">
        <div>
          <h1 className="page-title">Welcome back, Farmer 👋</h1>
          <p className="page-subtitle">
            Your all-in-one agriculture portal. Access government schemes, live
            market prices, and weather forecasts.
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/weather")}>
          Check Weather
        </button>
      </div>

      {/* ── Summary stats bar ── */}
      <div className="dashboard-stats animate-fade-in">
        {SUMMARY_STATS.map(({ label, value, icon }) => (
          <div key={label} className="stat-card">
            <span className="stat-icon">{icon}</span>
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* ── Quick-access feature cards ── */}
      <h2 className="section-heading">Quick Access</h2>
      <div className="grid-2">
        {FEATURE_CARDS.map((card) => (
          <Card
            key={card.path}
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            badge={card.badge}
            onClick={() => navigate(card.path)}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
