import React, { useMemo, useState } from "react";
import "./FarmingTools.css";

const FARMING_TOOLS = [
  {
    id: "mahindra-575",
    icon: "🚜",
    name: "Mahindra 575 DI Tractor",
    description:
      "47 HP tractor for ploughing, hauling, and planting. Suitable for 1-10 acre farms.",
    buyPrice: "Rs 6.5 lakh - Rs 8.5 lakh",
    buyMeta: "EMI from Rs 14,500 per month",
    rentPrice: "Rs 2,500 / day",
    rentMeta: "Deposit: Rs 5,000",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "claas-harvester",
    icon: "⚙️",
    name: "Claas Crop Tiger Harvester",
    description:
      "Cuts, threshes, and separates wheat and rice in one pass. Best for larger harvest windows.",
    buyPrice: "Rs 18 lakh - Rs 25 lakh",
    buyMeta: "Includes 1-year warranty",
    rentPrice: "Rs 1,500 / acre",
    rentMeta: "Deposit: Rs 15,000",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "vst-power-tiller",
    icon: "🔧",
    name: "VST Shakti Power Tiller",
    description:
      "13 HP tiller for small and marginal farmers. Compact, fuel-efficient, and paddy-field ready.",
    buyPrice: "Rs 1.2 lakh - Rs 1.8 lakh",
    buyMeta: "State subsidy may be available",
    rentPrice: "Rs 800 / day",
    rentMeta: "Deposit: Rs 2,000",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "rotary-tiller",
    icon: "🌀",
    name: "Rotary Tiller / Cultivator",
    description:
      "Breaks clods and incorporates organic matter. Improves soil aeration before sowing.",
    buyPrice: "Rs 80,000 - Rs 1.5 lakh",
    buyMeta: "Tractor-mounted add-on",
    rentPrice: "Rs 500 / day",
    rentMeta: "Deposit: Rs 1,500",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "seed-drill",
    icon: "🌱",
    name: "Seed Drill / Smart Planter",
    description:
      "Ensures precise row spacing and seed depth. Reduces wastage and improves germination.",
    buyPrice: "Rs 1 lakh - Rs 2.5 lakh",
    buyMeta: "9-row and 11-row variants",
    rentPrice: "Rs 600 / day",
    rentMeta: "Deposit: Rs 1,500",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "drip-system",
    icon: "💧",
    name: "Drip Irrigation System",
    description:
      "Delivers water directly to the root zone. Suitable for vegetables, fruits, cotton, and sugarcane.",
    buyPrice: "Rs 50,000 - Rs 2 lakh",
    buyMeta: "Subsidy support available under irrigation schemes",
    rentPrice: "Installation only",
    rentMeta: "Not usually rented daily",
    availability: "available",
    rentAvailable: false,
    buyAvailable: true,
  },
  {
    id: "sprinkler-set",
    icon: "🚿",
    name: "Sprinkler Irrigation Set",
    description:
      "Overhead irrigation for wheat, pulses, vegetables, and uneven land surfaces.",
    buyPrice: "Rs 25,000 - Rs 80,000",
    buyMeta: "Pipe length and motor size vary",
    rentPrice: "Rs 350 / day",
    rentMeta: "Deposit: Rs 1,000",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "battery-sprayer",
    icon: "🧴",
    name: "Battery Sprayer",
    description:
      "Portable crop-care sprayer for pesticides, micronutrients, and foliar feeding on small farms.",
    buyPrice: "Rs 3,500 - Rs 8,000",
    buyMeta: "16L and 20L tank options",
    rentPrice: "Rs 200 / day",
    rentMeta: "Deposit: Rs 500",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "agri-drone",
    icon: "🛸",
    name: "Agricultural Sprayer Drone",
    description:
      "Fast aerial spraying for large fields. Useful for paddy, cotton, and horticulture blocks.",
    buyPrice: "Rs 4 lakh - Rs 8 lakh",
    buyMeta: "Operator training required",
    rentPrice: "Rs 350 / acre",
    rentMeta: "Pilot and battery support extra",
    availability: "limited",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "thresher-machine",
    icon: "🌾",
    name: "Multi-crop Thresher",
    description:
      "Separates grain from paddy, wheat, soybean, and pulses. Saves labour during harvest season.",
    buyPrice: "Rs 80,000 - Rs 2 lakh",
    buyMeta: "Crop-compatible drum options available",
    rentPrice: "Rs 800 / day",
    rentMeta: "Deposit: Rs 2,000",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "paddy-transplanter",
    icon: "🌿",
    name: "Paddy Transplanter",
    description:
      "Uniform rice seedling placement with lower labour cost and faster planting on puddled fields.",
    buyPrice: "Rs 1.5 lakh - Rs 2.8 lakh",
    buyMeta: "Best with prepared nursery trays",
    rentPrice: "Rs 1,200 / acre",
    rentMeta: "Deposit: Rs 3,000",
    availability: "limited",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "soil-testing-kit",
    icon: "🧪",
    name: "Portable Soil Testing Kit",
    description:
      "Quick field checks for pH, nitrogen, phosphorus, potassium, and basic soil health indicators.",
    buyPrice: "Rs 5,000 - Rs 15,000",
    buyMeta: "Use lab testing for final fertilizer plans",
    rentPrice: "Testing service only",
    rentMeta: "Usually provided as a service visit",
    availability: "available",
    rentAvailable: false,
    buyAvailable: true,
  },
  {
    id: "gps-mapper",
    icon: "🧭",
    name: "GPS Field Mapper",
    description:
      "Measures field area and boundaries before irrigation layout, leasing, crop insurance, or subsidy work.",
    buyPrice: "Rs 25,000 - Rs 50,000",
    buyMeta: "Useful for survey and planning support",
    rentPrice: "Rs 1,000 / day",
    rentMeta: "Deposit: Rs 2,000",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
  {
    id: "mulch-layer",
    icon: "🛞",
    name: "Plastic Mulch Layer",
    description:
      "Lays mulch film with consistent spacing for vegetable beds, helping moisture retention and weed control.",
    buyPrice: "Rs 45,000 - Rs 90,000",
    buyMeta: "Single-bed and double-bed options",
    rentPrice: "Rs 700 / day",
    rentMeta: "Deposit: Rs 1,500",
    availability: "available",
    rentAvailable: true,
    buyAvailable: true,
  },
];

const FILTERS = [
  { key: "all", label: "All Tools" },
  { key: "rent", label: "🔑 Rent" },
  { key: "buy", label: "🛒 Buy" },
];

const AVAIL_LABELS = {
  available: "Available",
  limited: "Limited",
  unavailable: "Unavailable",
};

function FarmingTools() {
  const [activeFilter, setActiveFilter] = useState("all");

  const visibleTools = useMemo(() => {
    return FARMING_TOOLS.filter((tool) => {
      if (activeFilter === "rent") {
        return tool.rentAvailable;
      }

      if (activeFilter === "buy") {
        return tool.buyAvailable;
      }

      return true;
    });
  }, [activeFilter]);

  return (
    <div className="page-container">
      <section className="tools-hero animate-fade-in">
        <h1 className="tools-title">🚜 Farming Tools &amp; Machinery</h1>
        <p className="tools-subtitle">
          Browse modern agricultural equipment. Compare buy prices and daily rental
          rates across field preparation, sowing, irrigation, spraying, testing, and
          harvest work.
        </p>
      </section>

      <div className="tools-controls">
        <div className="tools-tabs" aria-label="Tool filters">
          {FILTERS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tools-tab${activeFilter === tab.key ? " active" : ""}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tools-grid">
        {visibleTools.map((tool, index) => (
          <article
            key={tool.id}
            className="tool-card animate-fade-in"
            style={{ animationDelay: `${index * 0.03}s` }}
          >
            <div className="tool-card-head">
              <div className="tool-title-row">
                <span className="tool-icon" aria-hidden="true">
                  {tool.icon}
                </span>
                <h3 className="tool-name">{tool.name}</h3>
              </div>
              <span className={`tool-avail-badge avail-${tool.availability}`}>
                {AVAIL_LABELS[tool.availability]}
              </span>
            </div>

            <p className="tool-use-case">{tool.description}</p>

            <div className="tool-pricing">
              <div className="tool-price-block tool-price-buy">
                <div className="tool-price-label">Buy Price</div>
                <div className="tool-price-value">{tool.buyPrice}</div>
                <div className="tool-price-note">{tool.buyMeta}</div>
              </div>
              <div className="tool-price-block tool-price-rent">
                <div className="tool-price-label">Rent</div>
                <div className="tool-price-value">{tool.rentPrice}</div>
                <div className="tool-price-note">{tool.rentMeta}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default FarmingTools;
