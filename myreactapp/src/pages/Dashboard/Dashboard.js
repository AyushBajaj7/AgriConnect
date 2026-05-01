/**
 * File: Dashboard.js
 * Description: Landing page after login. Displays a welcome hero section,
 *              a four-stat summary bar (symmetrical grid), and a 2×2 grid
 *              of quick-access feature cards with live data indicators.
 *
 * Props: none
 * Used in: App.js (route /dashboard)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card/Card";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

/**
 * Feature cards displayed in the quick-access grid.
 * Each card links to a primary feature page.
 */
const FEATURE_CARDS = [
  {
    icon: "📋",
    title: "Government Schemes",
    subtitle:
      "Browse 35+ central and state agriculture schemes with eligibility details, budgets, and direct links to official portals.",
    badge: { label: "35 Schemes", color: "blue" },
    path: "/schemes",
    liveKey: "schemes",
  },
  {
    icon: "📊",
    title: "Crop Prices",
    subtitle:
      "Live mandi pricing feed with auto-refresh every 5 minutes. Compare prices across markets, crops, and regions.",
    badge: { label: "Live Feed", color: "green" },
    path: "/crop-prices",
    liveKey: "prices",
  },
  {
    icon: "🚜",
    title: "Farming Tools",
    subtitle:
      "Browse tractors, harvesters, irrigation systems, drones and more with specifications and price ranges.",
    badge: { label: "Equipment", color: "gold" },
    path: "/tools",
    liveKey: "tools",
  },
  {
    icon: "🌦️",
    title: "Weather Report",
    subtitle:
      "Real-time weather forecasts, air quality analysis, and crop risk assessment for smart field planning.",
    badge: { label: "Live Weather", color: "green" },
    path: "/weather",
    liveKey: "weather",
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");

  // Live clock for a real-time feel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic greeting based on time of day
  const getGreeting = useCallback(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [currentTime]);

  useEffect(() => {
    setGreeting(getGreeting());
  }, [getGreeting]);

  const formattedDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const userName = authUser?.username
    ? authUser.username.charAt(0).toUpperCase() + authUser.username.slice(1)
    : "Farmer";

  return (
    <div className="page-container">
      {/* ── Hero / welcome banner ── */}
      <div className="dashboard-hero animate-fade-in">
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-greeting">
            <span className="hero-wave" aria-hidden="true">👋</span>
            <h1 className="page-title">
              {greeting}, {userName}
            </h1>
          </div>
          <p className="page-subtitle">
            Your one-stop platform for weather intelligence, mandi pricing,
            government schemes, and farm equipment guidance.
          </p>
          <div className="dashboard-hero-meta">
            <span className="hero-date">📅 {formattedDate}</span>
            <span className="hero-time">🕐 {formattedTime}</span>
          </div>
        </div>
        <div className="dashboard-hero-actions">
          <button className="btn-primary" onClick={() => navigate("/weather")}>
            🌦️ Check Weather
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate("/crop-prices")}
          >
            📊 View Prices
          </button>
        </div>
      </div>

      {/* ── Quick stats bar (4 symmetrical items) ── */}
      <div className="dashboard-stats animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="stat-card" onClick={() => navigate("/schemes")} role="button" tabIndex={0}>
          <span className="stat-icon">📋</span>
          <p className="stat-value">35</p>
          <p className="stat-label">Government Schemes</p>
        </div>
        <div className="stat-card" onClick={() => navigate("/crop-prices")} role="button" tabIndex={0}>
          <span className="stat-icon">📊</span>
          <p className="stat-value">5</p>
          <p className="stat-label">Price Categories</p>
        </div>
        <div className="stat-card" onClick={() => navigate("/tools")} role="button" tabIndex={0}>
          <span className="stat-icon">🚜</span>
          <p className="stat-value">7+</p>
          <p className="stat-label">Farming Tools</p>
        </div>
        <div className="stat-card" onClick={() => navigate("/weather")} role="button" tabIndex={0}>
          <span className="stat-icon">🌦️</span>
          <p className="stat-value">Live</p>
          <p className="stat-label">Weather Data</p>
        </div>
      </div>

      <div className="divider" />

      {/* ── Quick-access feature cards (2×2 symmetrical grid) ── */}
      <h2 className="section-heading">Explore Features</h2>
      <div className="dashboard-grid">
        {FEATURE_CARDS.map((card, index) => (
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
