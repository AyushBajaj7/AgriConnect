import React, { useCallback, useEffect, useMemo, useState } from "react";
import Loader from "../../components/Loader/Loader";
import { fetchMandiPrices, PRICE_CATEGORIES } from "../../services/priceService";
import "./CropPrices.css";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

const CATEGORY_LABELS = {
  all: "All items",
  crops: "Crops",
  vegetables: "Vegetables",
  fruits: "Fruits",
  livestock: "Livestock",
  seeds: "Seeds",
  fertilizers: "Fertilizers",
};

const TREND_LABELS = {
  up: "Rising",
  down: "Falling",
  stable: "Stable",
};

const SORT_OPTIONS = [
  { key: "market", label: "Market name" },
  { key: "price-asc", label: "Low price" },
  { key: "price-desc", label: "High price" },
];

function formatTime(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function secondsUntil(value) {
  if (!value) return REFRESH_INTERVAL_MS / 1000;
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) return REFRESH_INTERVAL_MS / 1000;
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

function CropPrices() {
  const [prices, setPrices] = useState([]);
  const [feedMeta, setFeedMeta] = useState({
    source: "reference",
    label: "Reference prices",
    warning: "",
    fetchedAt: null,
    checkedAt: null,
    cacheUpdatedAt: null,
    nextLiveCheckAt: null,
    stale: false,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("market");
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);

  const categoryCounts = useMemo(
    () =>
      prices.reduce(
        (counts, price) => ({
          ...counts,
          [price.category]: (counts[price.category] ?? 0) + 1,
        }),
        { all: prices.length },
      ),
    [prices],
  );

  const visibleCategories = useMemo(
    () =>
      PRICE_CATEGORIES.filter(
        (category) => category === "all" || (categoryCounts[category] ?? 0) > 0,
      ),
    [categoryCounts],
  );

  const loadPrices = useCallback(async () => {
    setLoading(true);
    const data = await fetchMandiPrices();
    setPrices(data.records);
    setFeedMeta(data.meta);
    setLastCheckedAt(data.meta.checkedAt ?? new Date().toISOString());
    setCountdown(secondsUntil(data.meta.nextLiveCheckAt));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPrices();
    const refreshTimer = setInterval(loadPrices, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshTimer);
  }, [loadPrices]);

  useEffect(() => {
    const tick = setInterval(
      () => setCountdown((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(tick);
  }, [lastCheckedAt]);

  useEffect(() => {
    if (!visibleCategories.includes(activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, visibleCategories]);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return prices
      .filter((price) => {
        const matchSearch =
          !query ||
          price.commodity.toLowerCase().includes(query) ||
          price.market.toLowerCase().includes(query) ||
          price.variety.toLowerCase().includes(query) ||
          price.state.toLowerCase().includes(query);
        const matchCategory =
          activeCategory === "all" || price.category === activeCategory;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        if (sortBy === "market") {
          const marketSort = a.market.localeCompare(b.market);
          if (marketSort !== 0) {
            return marketSort;
          }

          return a.commodity.localeCompare(b.commodity);
        }
        if (sortBy === "price-asc") return a.modalPrice - b.modalPrice;
        if (sortBy === "price-desc") return b.modalPrice - a.modalPrice;
        return 0;
      });
  }, [activeCategory, prices, searchQuery, sortBy]);

  const bannerTitle =
    feedMeta.source === "live"
      ? "Live market prices"
      : feedMeta.source === "cached" || feedMeta.source === "stale"
        ? "Showing last saved live prices"
        : "Showing reference prices";

  const feedTimeLabel =
    feedMeta.source === "live" ? "Live fetched" : "Cache updated";
  const feedTimeValue = feedMeta.cacheUpdatedAt ?? feedMeta.fetchedAt;

  return (
    <div className="page-container">
      <div className="prices-header">
        <h1 className="page-title">Market Prices</h1>
        <p className="page-subtitle">
          Compare crop prices by mandi, crop, and price range. The page only
          says live when the government source returns current records.
        </p>
        <div className="prices-refresh-info">
          <span className={`prices-live-badge prices-live-badge-${feedMeta.source}`}>
            {feedMeta.label}
          </span>
          <span className="prices-updated">
            {feedTimeLabel}: {formatTime(feedTimeValue)}
          </span>
          <span className="prices-updated">
            Page checked: {formatTime(feedMeta.checkedAt ?? lastCheckedAt)}
          </span>
          <span className="prices-countdown">
            Next live check in {countdown}s
          </span>
          <button
            type="button"
            className="btn-secondary prices-refresh-btn"
            onClick={loadPrices}
            disabled={loading}
          >
            {loading ? "Checking…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div className="info-banner">
        <div className="info-banner-title">{bannerTitle}</div>
        <div className="info-banner-text">
          {feedMeta.warning ||
            "These prices came from the live mandi source. Verify final selling decisions with your local market."}
        </div>
      </div>

      <div className="prices-category-tabs" aria-label="Price categories">
        {visibleCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={`prices-tab${activeCategory === category ? " active" : ""}`}
            onClick={() => setActiveCategory(category)}
          >
            <span>{CATEGORY_LABELS[category]}</span>
            <span className="prices-tab-count">
              {(categoryCounts[category] ?? 0).toLocaleString("en-IN")}
            </span>
          </button>
        ))}
      </div>

      <div className="prices-controls">
        <input
          className="prices-search"
          type="text"
          id="crop-search"
          name="crop-search"
          placeholder="Search crop, mandi, or state"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          autoComplete="off"
        />
        <div
          className="prices-sort-options"
          role="group"
          aria-label="Sort market prices"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`prices-sort-option${sortBy === option.key ? " active" : ""}`}
              onClick={() => setSortBy(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="prices-count">{filtered.length} results</span>
      </div>

      {loading ? (
        <Loader text="Checking market prices..." />
      ) : (
        <div className="prices-table-wrapper">
          <table className="prices-table">
            <thead>
              <tr>
                <th>Market location</th>
                <th>Crop and variety</th>
                <th>Price range per quintal</th>
                <th>Main price</th>
                <th>Map</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="prices-row">
                  <td className="prices-market" data-label="Market location">
                    <div>
                      <div className="prices-market-name">{item.market}</div>
                      <div className="prices-state">{item.state}</div>
                    </div>
                  </td>
                  <td className="prices-crop" data-label="Crop and variety">
                    <div className="prices-commodity">
                      {item.commodity}{" "}
                      <span className="prices-variety">({item.variety})</span>
                    </div>
                    <span className={`prices-cat-badge prices-cat-${item.category}`}>
                      {CATEGORY_LABELS[item.category] ?? "Crop"}
                    </span>
                  </td>
                  <td className="prices-range" data-label="Price range per quintal">
                    Rs {item.minPrice.toLocaleString("en-IN")} to Rs{" "}
                    {item.maxPrice.toLocaleString("en-IN")}
                  </td>
                  <td className="prices-modal" data-label="Main price">
                    <span className={`prices-trend trend-${item.trend}`}>
                      {TREND_LABELS[item.trend] ?? "Stable"}
                    </span>
                    <span className="prices-modal-value">
                      Rs {item.modalPrice.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td data-label="Map">
                    <a
                      className="btn-navigate"
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        `${item.market} mandi ${item.state}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${item.market} mandi in Google Maps`}
                    >
                      Open map
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="prices-empty">
              <p>
                No prices found for "<strong>{searchQuery}</strong>" in{" "}
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
