/**
 * File: CropPrices.js
 * Description: Live mandi price table fetched from Agmarknet API (or static fallback).
 *              Auto-refreshes every 5 minutes. Supports full-text search, category
 *              filtering, and sorting by distance or price.
 * State:
 *   prices        {Array}    — loaded mandi price records
 *   loading       {boolean}
 *   searchQuery   {string}
 *   activeCategory{string}
 *   sortBy        {string}   — 'distance' | 'price-asc' | 'price-desc'
 *   lastUpdated   {Date}
 * Used in: App.js (route /crop-prices)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  fetchMandiPrices,
  PRICE_CATEGORIES,
} from "../../services/priceService";
import Loader from "../../components/Loader/Loader";
import "./CropPrices.css";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const CATEGORY_LABELS = {
  all: "All Items",
  crops: "Crops 🌾",
  vegetables: "Vegetables 🥦",
  fruits: "Fruits 🍎",
  seeds: "Seeds 🌱",
  fertilizers: "Fertilizers 🧪",
};

const TREND_ICONS = { up: "↑", down: "↓", stable: "→" };

function formatTime(date) {
  if (!date) return "–";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CropPrices() {
  const [prices, setPrices] = useState([]);
  const [feedMeta, setFeedMeta] = useState({
    source: "reference",
    label: "Reference data",
    warning: "",
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);

  const loadPrices = useCallback(async () => {
    setLoading(true);
    const data = await fetchMandiPrices();
    setPrices(data.records);
    setFeedMeta(data.meta);
    setLastUpdated(new Date());
    setCountdown(REFRESH_INTERVAL_MS / 1000);
    setLoading(false);
  }, []);

  // Initial load + auto-refresh every 5 minutes
  useEffect(() => {
    loadPrices();
    const refreshTimer = setInterval(loadPrices, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshTimer);
  }, [loadPrices]);

  // Countdown timer (ticks every second)
  useEffect(() => {
    const tick = setInterval(
      () => setCountdown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => clearInterval(tick);
  }, [lastUpdated]);

  // Filter and sort
  const filtered = prices
    .filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.state.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        activeCategory === "all" || p.category === activeCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "price-asc") return a.modalPrice - b.modalPrice;
      if (sortBy === "price-desc") return b.modalPrice - a.modalPrice;
      return 0;
    });

  return (
    <div className="page-container">
      <div className="prices-header">
        <div>
          <h1 className="page-title">Market Prices</h1>
          <p className="page-subtitle">
            Compare mandi pricing by crop, market, and distance. When the live
            source is unavailable, the page falls back to curated reference
            values instead of guessing.
          </p>
        </div>
        <div className="prices-refresh-info">
          <span
            className={`prices-live-badge prices-live-badge-${feedMeta.source}`}
          >
            {feedMeta.label}
          </span>
          <span className="prices-updated">
            Updated: {formatTime(lastUpdated)}
          </span>
          <span className="prices-countdown">Retrying in {countdown}s</span>
          <button
            className="btn-secondary prices-refresh-btn"
            onClick={loadPrices}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {feedMeta.warning && (
        <div className="info-banner">
          <div className="info-banner-title">Fallback mode</div>
          <div className="info-banner-text">{feedMeta.warning}</div>
        </div>
      )}

      {/* Category tabs */}
      <div className="prices-category-tabs">
        {PRICE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`prices-tab${activeCategory === cat ? " active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="prices-controls">
        <input
          className="prices-search"
          type="text"
          id="crop-search"
          name="crop-search"
          placeholder="Search crops, mandis, and states"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
        />
        <select
          className="prices-sort"
          id="crop-sort"
          name="crop-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="distance">Sort by Distance</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
        <span className="prices-count">{filtered.length} results</span>
      </div>

      {loading ? (
        <Loader text="Fetching live mandi prices…" />
      ) : (
        <div className="prices-table-wrapper">
          <table className="prices-table">
            <thead>
              <tr>
                <th>Market Location</th>
                <th>Crop (Variety)</th>
                <th>Distance</th>
                <th>Price Range (₹/Quintal)</th>
                <th>Modal Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="prices-row">
                  <td className="prices-market">
                    <span className="prices-pin">📍</span>
                    <div>
                      <div className="prices-market-name">{item.market}</div>
                      <div className="prices-state">{item.state}</div>
                    </div>
                  </td>
                  <td className="prices-crop">
                    <div className="prices-commodity">
                      {item.commodity}{" "}
                      <span className="prices-variety">({item.variety})</span>
                    </div>
                    <span
                      className={`prices-cat-badge prices-cat-${item.category}`}
                    >
                      {item.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="prices-distance">{item.distance} km</td>
                  <td className="prices-range">
                    <span className="range-min">
                      ₹{item.minPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="range-sep"> – </span>
                    <span className="range-max">
                      ₹{item.maxPrice.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="prices-modal">
                    <span className={`prices-trend trend-${item.trend}`}>
                      {TREND_ICONS[item.trend]}
                    </span>
                    <span className="prices-modal-value">
                      ₹{item.modalPrice.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td>
                    <a
                      className="btn-navigate"
                      href={`https://www.google.com/maps/search/${encodeURIComponent(item.market)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Navigate
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="prices-empty">
              <p>
                No results for "<strong>{searchQuery}</strong>" in{" "}
                {CATEGORY_LABELS[activeCategory]}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CropPrices;
