import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card/Card";
import { useAuth } from "../../context/AuthContext";
import { getBackendOrigin } from "../../services/backendOrigin";
import { fetchMandiPrices } from "../../services/priceService";
import "./Dashboard.css";

const API_BASE_URL = getBackendOrigin();

const FEATURE_CARDS = [
  {
    icon: "Schemes",
    title: "Government schemes",
    subtitle:
      "Find reviewed central and state agriculture schemes with eligibility, deadlines, and official source guidance.",
    badge: { label: "Reviewed directory", color: "blue" },
    path: "/schemes",
  },
  {
    icon: "Prices",
    title: "Market prices",
    subtitle:
      "Check mandi prices. Live data is shown only when the source is working; otherwise the page clearly marks stale or reference data.",
    badge: { label: "Truth-labeled data", color: "teal" },
    path: "/crop-prices",
  },
  {
    icon: "Tools",
    title: "Farming tools",
    subtitle:
      "Compare tractors, harvesters, irrigation equipment, drones, and other farm tools with practical buying and rental notes.",
    badge: { label: "Equipment guide", color: "gold" },
    path: "/tools",
  },
  {
    icon: "Weather",
    title: "Weather updates",
    subtitle:
      "Review weather and air-quality information before irrigation, spraying, harvesting, or field travel.",
    badge: { label: "Planning support", color: "slate" },
    path: "/weather",
  },
];

function getGreeting(date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

async function fetchPriceStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prices/status`);
    if (!response.ok) throw new Error("Price status unavailable");
    return response.json();
  } catch {
    const fallback = await fetchMandiPrices();
    return {
      state: fallback.meta?.source ?? "reference",
      message: fallback.meta?.warning ?? "Showing reference price data.",
      lastSuccessAt: fallback.meta?.fetchedAt ?? null,
    };
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [priceStatus, setPriceStatus] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPriceStatus().then(setPriceStatus);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userName = authUser?.username
    ? authUser.username.charAt(0).toUpperCase() + authUser.username.slice(1)
    : "Farmer";

  const priceLabel = useMemo(() => {
    if (!priceStatus) return "Checking";
    if (priceStatus.state === "live") return "Live";
    if (priceStatus.state === "cached") return "Saved live";
    if (priceStatus.state === "stale") return "Stale";
    if (priceStatus.state === "reference" || priceStatus.state === "unavailable") {
      return "Reference";
    }
    return "Checking";
  }, [priceStatus]);

  const stats = [
    {
      label: "Government schemes",
      value: "35",
      note: "Reviewed entries",
      path: "/schemes",
    },
    {
      label: "Market price feed",
      value: priceLabel,
      note: "Live status",
      path: "/crop-prices",
    },
    {
      label: "Farming tool guides",
      value: "7+",
      note: "Equipment categories",
      path: "/tools",
    },
    {
      label: "Weather updates",
      value: "Ready",
      note: "Planning support",
      path: "/weather",
    },
  ];

  return (
    <div className="page-container">
      <section className="dashboard-hero animate-fade-in">
        <div className="dashboard-hero-content">
          <h1 className="page-title">
            {getGreeting(currentTime)}, {userName}
          </h1>
          <p className="page-subtitle">
            Use AgriConnect to check scheme guidance, mandi price status,
            weather conditions, and farming tools from one place.
          </p>
          <div className="dashboard-hero-meta">
            <span className="hero-date">{formattedDate}</span>
            <span className="hero-time">
              {currentTime.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="dashboard-hero-actions">
          <button type="button" className="btn-primary" onClick={() => navigate("/crop-prices")}>
            Check market prices
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/schemes")}>
            View government schemes
          </button>
        </div>
      </section>

      <section className="dashboard-stats animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {stats.map((stat) => (
          <button
            key={stat.label}
            className="stat-card"
            type="button"
            onClick={() => navigate(stat.path)}
          >
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-note">{stat.note}</span>
          </button>
        ))}
      </section>

      <div className="divider" />

      <h2 className="section-heading">Main services</h2>
      <div className="dashboard-grid">
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
