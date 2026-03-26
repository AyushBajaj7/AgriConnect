/**
 * File: FarmingTools.js
 * Description: Farming tools and machinery page with Buy / Rent tabs.
 *              15 tools with buy prices, rent rates, deposit info, and availability.
 * Used in: App.js (route /tools)
 */

import React, { useState } from 'react';
import './FarmingTools.css';

const FARMING_TOOLS = [
  { id:'tractor-mahindra',   name:'Mahindra 575 DI Tractor',       emoji:'🚜', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹6.5 – ₹8.5 Lakhs',  buyNote:'EMI from ₹14,500/mo',    rentPerDay:'₹2,500 / day', rentAlt:'₹300 / hr',       deposit:'₹5,000',    availability:'available', useCase:'47 HP tractor for ploughing, hauling, and planting. 2WD / 4WD. Suitable for 1–10 acre farms.' },
  { id:'harvester-claas',    name:'Claas Crop Tiger Harvester',     emoji:'⚙️', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹18 – ₹25 Lakhs',    buyNote:'Includes 1-yr warranty', rentPerDay:'₹1,500 / acre',rentAlt:'₹4,000 / day',   deposit:'₹15,000',   availability:'available', useCase:'Cuts, threshes, and separates wheat & rice in one pass. Ideal for 10+ acre harvests.' },
  { id:'power-tiller',       name:'VST Shakti Power Tiller',        emoji:'🔧', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹1.2 – ₹1.8 Lakhs',  buyNote:'Govt subsidy available', rentPerDay:'₹800 / day',   rentAlt:'₹120 / hr',      deposit:'₹2,000',    availability:'available', useCase:'13 HP tiller for small and marginal farmers. Compact, fuel-efficient. Works in paddy fields.' },
  { id:'rotary-tiller',      name:'Rotary Tiller / Cultivator',     emoji:'🌀', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹80,000 – ₹1.5 Lakhs',buyNote:'Tractor-mounted add-on', rentPerDay:'₹500 / day',   rentAlt:'₹400 / day',     deposit:'₹1,500',    availability:'available', useCase:'Breaks clods and incorporates organic matter. Improves soil aeration before sowing.' },
  { id:'seed-drill',         name:'Seed Drill / Smart Planter',     emoji:'🌱', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹1 – ₹2.5 Lakhs',    buyNote:'9-row / 11-row variants',rentPerDay:'₹600 / day',   rentAlt:null,             deposit:'₹1,500',    availability:'available', useCase:'Ensures precise row spacing and seed depth. Reduces wastage by 30–40%. Compatible with tractors.' },
  { id:'drip-irrigation',    name:'Drip Irrigation System',         emoji:'💧', category:'irrigation', forSale:true,  forRent:false, buyPrice:'₹50,000 – ₹2 Lakhs', buyNote:'Subsidy up to 80% (PMKSY)',rentPerDay:null,          rentAlt:null,             deposit:null,        availability:'available', useCase:'Delivers water directly to root zone. Saves 50% water. Ideal for vegetables, fruits, cotton.' },
  { id:'sprinkler',          name:'Sprinkler Irrigation Set',        emoji:'🌦️', category:'irrigation', forSale:true,  forRent:true,  buyPrice:'₹25,000 – ₹80,000',  buyNote:'Per acre setup cost',    rentPerDay:'₹350 / day',   rentAlt:'₹1,500 / season',deposit:'₹1,000',    availability:'available', useCase:'Overhead watering system for wheat, vegetables, and groundnut. Covers large areas evenly.' },
  { id:'agri-drone',         name:'Agricultural Drone (Sprayer)',    emoji:'🚁', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹4 – ₹8 Lakhs',      buyNote:'40% FPO/IFFCO subsidy', rentPerDay:'₹3,500 / day', rentAlt:'₹350 / acre',    deposit:'₹10,000',   availability:'limited',   useCase:'DJI / IdeaForge sprayer drone for pesticides and fertilizers. Covers 30 acres per hour.' },
  { id:'battery-sprayer',    name:'Battery-Powered Knapsack Sprayer',emoji:'🧪', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹3,500 – ₹8,000',    buyNote:'16L tank, rechargeable',rentPerDay:'₹200 / day',   rentAlt:null,             deposit:'₹500',      availability:'available', useCase:'Electric sprayer for pesticides and foliar nutrition. 6–8 hour battery. Auto-shutoff nozzle.' },
  { id:'chaff-cutter',       name:'Chaff Cutter (Electric)',         emoji:'⚡', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹25,000 – ₹55,000',  buyNote:'1–5 HP motor variants', rentPerDay:'₹400 / day',   rentAlt:null,             deposit:'₹1,000',    availability:'available', useCase:'Cuts hay, straw, and green fodder for livestock. Electric model processes 300–500 kg/hr.' },
  { id:'thresher',           name:'Thresher Machine',                emoji:'🌾', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹80,000 – ₹2 Lakhs', buyNote:'Tractor-driven variants',rentPerDay:'₹800 / day',   rentAlt:'₹600 / quintal', deposit:'₹2,000',    availability:'available', useCase:'Separates grain from harvested stalks for wheat, paddy, soybean, and pulses.' },
  { id:'transplanter',       name:'Paddy Transplanter (6-row)',      emoji:'🌿', category:'machinery',  forSale:true,  forRent:true,  buyPrice:'₹1.5 – ₹2.8 Lakhs',  buyNote:'Govt subsidy ~50%',     rentPerDay:'₹900 / day',   rentAlt:'₹1,200 / acre',  deposit:'₹3,000',    availability:'limited',   useCase:'Plants rice seedlings at uniform spacing. Reduces labour cost by 70%. Covers 2 acres/day.' },
  { id:'soil-testing-kit',   name:'Portable Soil Testing Kit',      emoji:'🔬', category:'tools',      forSale:true,  forRent:false, buyPrice:'₹5,000 – ₹15,000',   buyNote:'28-parameter digital',  rentPerDay:null,           rentAlt:null,             deposit:null,        availability:'available', useCase:'Tests NPK, pH, organic carbon, and micronutrients on-farm in 30 minutes. Includes reagent set.' },
  { id:'gps-mapper',         name:'GPS Field Area Mapper',           emoji:'📡', category:'tools',      forSale:true,  forRent:true,  buyPrice:'₹25,000 – ₹50,000',  buyNote:'Handheld + app',        rentPerDay:'₹1,000 / day', rentAlt:null,             deposit:'₹2,000',    availability:'available', useCase:'Accurately measures field area, draws field boundaries, and tracks crop records via Android app.' },
  { id:'cold-storage',       name:'Cold Storage Unit (Shared)',      emoji:'❄️', category:'storage',    forSale:false, forRent:true,  buyPrice:null,                  buyNote:null,                    rentPerDay:'₹15 / kg·month',rentAlt:'₹250 / MT·day',  deposit:'₹1,000',    availability:'available', useCase:'Shared refrigerated storage for onion, potato, apple, and mango. Temp 0–15°C. AIF-subsidized.' },
];

const TABS = [
  { key: 'all',  label: 'All Tools'  },
  { key: 'rent', label: '🔑 Rent'    },
  { key: 'buy',  label: '🛒 Buy'     },
];

const AVAIL_LABELS = { available: 'Available', limited: 'Limited', unavailable: 'Fully Booked' };

function FarmingTools() {
  const [activeTab, setActiveTab] = useState('all');

  const visible = FARMING_TOOLS.filter(t =>
    activeTab === 'all'  ? true :
    activeTab === 'rent' ? t.forRent :
    activeTab === 'buy'  ? t.forSale : true
  );

  return (
    <div className="page-container">
      <h1 className="page-title">🚜 Farming Tools &amp; Machinery</h1>
      <p className="page-subtitle">
        Browse modern agricultural equipment. Compare buy prices vs daily rental rates.
      </p>

      {/* Tabs */}
      <div className="tools-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tools-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tools-grid">
        {visible.map((tool, index) => (
          <div
            key={tool.id}
            className="tool-card animate-fade-in"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {/* Availability badge */}
            <span className={`tool-avail-badge avail-${tool.availability}`}>
              {AVAIL_LABELS[tool.availability]}
            </span>

            <div className="tool-card-top">
              <span className="tool-emoji">{tool.emoji}</span>
              <h3 className="tool-name">{tool.name}</h3>
            </div>

            <p className="tool-use-case">{tool.useCase}</p>

            <div className="tool-pricing">
              {tool.forSale && tool.buyPrice && (
                <div className="tool-price-block tool-price-buy">
                  <div className="tool-price-label">🛒 Buy Price</div>
                  <div className="tool-price-value">{tool.buyPrice}</div>
                  {tool.buyNote && <div className="tool-price-note">{tool.buyNote}</div>}
                </div>
              )}
              {tool.forRent && tool.rentPerDay && (
                <div className="tool-price-block tool-price-rent">
                  <div className="tool-price-label">🔑 Rent</div>
                  <div className="tool-price-value">{tool.rentPerDay}</div>
                  {tool.rentAlt && <div className="tool-price-note">or {tool.rentAlt}</div>}
                  {tool.deposit && <div className="tool-price-note">Deposit: {tool.deposit}</div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FarmingTools;
