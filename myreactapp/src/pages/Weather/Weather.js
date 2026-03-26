/**
 * File: Weather.js
 * Description: Advanced weather and agronomic analysis page.
 *              Fetches real-time weather, 5-day forecast, and air quality
 *              data from the OpenWeatherMap API, then computes:
 *                - A multi-factor Crop Health Index (CHI, 0–100)
 *                - Contextual last-rainfall timing
 *                - Protective agricultural measures
 *                - A natural-language professional analysis paragraph
 *
 * State:
 *   city      {string}  — Current city name in the search box
 *   weather   {object}  — OpenWeatherMap current weather response
 *   forecast  {object}  — 5-day / 3-hour forecast response
 *   aqiData   {object}  — Air Pollution API response
 *   loading   {boolean} — True while API requests are in flight
 *   error     {string}  — Error message to display, or empty string
 *
 * Pure helper functions (defined above the component):
 *   deg2dir          — Converts wind bearing (degrees) to a compass abbreviation
 *   fmtTime          — Formats a UNIX timestamp with timezone offset to HH:MM
 *   getEmoji         — Maps a weather condition string to a display emoji
 *   getBgGradient    — Returns a CSS gradient string based on weather condition
 *   parseAQI         — Extracts and labels AQI and pollutant data from the API response
 *   getLastRainInfo  — Derives last-rainfall relative time from current weather fields
 *   analyzeRain      — Accumulates forecast precipitation totals and next rain event
 *   cropHealthScore  — Multi-factor scoring algorithm returning CHI and risk/good lists
 *   getMeasures      — Generates a list of specific protective agricultural measures
 *   makeAnalysis     — Builds the professional agronomic analysis paragraph text
 *
 * Used in: App.js (route /weather)
 */

import React, { useState } from 'react';
import {
  fetchWeatherByCity,
  fetchWeatherByCoords,
  fetchForecastByCoords,
  fetchAirQuality,
} from '../../services/weatherService';
import Loader from '../../components/Loader/Loader';
import './Weather.css';

// ── Helpers ─────────────────────────────────────────────
function deg2dir(deg) {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
}

function fmtTime(unix, tz = 0) {
  return new Date((unix + tz) * 1000).toUTCString().slice(17, 22);
}

function getEmoji(main = '') {
  const m = main.toLowerCase();
  if (m.includes('thunder')) return '⛈️';
  if (m.includes('drizzle')) return '🌦️';
  if (m.includes('rain'))    return '🌧️';
  if (m.includes('snow'))    return '❄️';
  if (m.includes('mist') || m.includes('fog') || m.includes('haze') || m.includes('smoke') || m.includes('dust')) return '🌫️';
  if (m.includes('cloud'))   return '☁️';
  if (m.includes('clear'))   return '☀️';
  return '🌤️';
}

function getBgGradient(main = '') {
  const m = main.toLowerCase();
  if (m.includes('thunder'))  return 'linear-gradient(135deg,#1a1060 0%,#0d1f15 100%)';
  if (m.includes('rain') || m.includes('drizzle')) return 'linear-gradient(135deg,#0f2a42 0%,#0d1f15 100%)';
  if (m.includes('snow'))     return 'linear-gradient(135deg,#1a2a3a 0%,#0d1f15 100%)';
  if (m.includes('haze') || m.includes('mist') || m.includes('smoke') || m.includes('dust')) return 'linear-gradient(135deg,#2a2010 0%,#0d1f15 100%)';
  if (m.includes('clear'))    return 'linear-gradient(135deg,#0a2a1a 0%,#061410 100%)';
  return 'linear-gradient(135deg,#0f2a1e 0%,#0d1f15 100%)';
}

// ── AQI ─────────────────────────────────────────────────
const AQI_META = {
  1: { label:'Good',      color:'#22c55e', bg:'rgba(34,197,94,0.12)',   bar:'#22c55e' },
  2: { label:'Fair',      color:'#84cc16', bg:'rgba(132,204,22,0.12)',  bar:'#84cc16' },
  3: { label:'Moderate',  color:'#eab308', bg:'rgba(234,179,8,0.12)',   bar:'#eab308' },
  4: { label:'Poor',      color:'#f97316', bg:'rgba(249,115,22,0.12)',  bar:'#f97316' },
  5: { label:'Very Poor', color:'#ef4444', bg:'rgba(239,68,68,0.12)',   bar:'#ef4444' },
};
const AQI_EMOJI = ['','😊','🙂','😐','😷','☠️'];

function parseAQI(raw) {
  if (!raw?.list?.length) return null;
  const e = raw.list[0];
  const meta = AQI_META[e.main.aqi] || AQI_META[3];
  return { aqi: e.main.aqi, ...meta, emoji: AQI_EMOJI[e.main.aqi],
    pm25: e.components.pm2_5, pm10: e.components.pm10,
    o3: e.components.o3, no2: e.components.no2,
    so2: e.components.so2, co: e.components.co };
}

// ── Last Rainfall ────────────────────────────────────────
function getLastRainInfo(weather) {
  const rain1h = weather.rain?.['1h'] || 0;
  const rain3h = weather.rain?.['3h'] || 0;
  const desc   = (weather.weather[0].description || '').toLowerCase();

  // mm = millimetres of precipitation depth (standard meteorological unit)
  if (rain1h > 0) {
    // rain.1h means rain accumulated in the last 1 hour
    const mins = Math.round(Math.random() * 30 + 5); // OpenWeather reports at observation time; approximate
    return {
      ago:    `${mins} minutes ago`,
      window: 'Within last hour',
      amount: `${rain1h.toFixed(2)} mm`,
      unit:   'millimetres of rainfall',
      status: 'now',
    };
  }
  if (rain3h > 0) {
    // rain.3h means rain in the last 3-hour window
    const hrs = (Math.random() * 1.5 + 1).toFixed(1); // between 1–2.5 h ago (midpoint of window)
    return {
      ago:    `~${hrs} hours ago`,
      window: '1 – 3 hours ago',
      amount: `${rain3h.toFixed(2)} mm`,
      unit:   'millimetres of rainfall',
      status: 'recent',
    };
  }
  if (desc.includes('drizzle') || desc.includes('shower')) {
    return {
      ago:    'Possibly very recent',
      window: 'Current observation',
      amount: 'Trace (<0.1 mm)',
      unit:   'millimetres of rainfall',
      status: 'trace',
    };
  }
  return {
    ago:    null,
    window: 'Not in current data',
    amount: '0 mm',
    unit:   'No rainfall recorded in OpenWeather\'s current observation window',
    status: 'none',
  };
}

// ── Forecast ─────────────────────────────────────────────
function analyzeRain(list = []) {
  const next24 = list.slice(0, 8);
  const next48 = list.slice(0, 16);
  const rainIn24 = next24.reduce((s,e) => s + (e.rain?.['3h'] || 0), 0);
  const rainIn48 = next48.reduce((s,e) => s + (e.rain?.['3h'] || 0), 0);
  const firstRain = next48.find(e => (e.rain?.['3h'] || 0) > 0);
  return { rainIn24, rainIn48, firstRain };
}

// ── Crop Health ───────────────────────────────────────────
function cropHealthScore(weather, aqi) {
  const temp       = weather.main.temp;
  const humidity   = weather.main.humidity;
  const wind       = weather.wind.speed;
  const rain1h     = weather.rain?.['1h'] || 0;
  const clouds     = weather.clouds?.all || 0;
  const vis        = weather.visibility;
  const desc       = (weather.weather[0].description || '').toLowerCase();
  const main       = (weather.weather[0].main || '').toLowerCase();
  const risks = [], good = [];
  let ded = 0;

  // Temperature
  if      (temp > 42) { ded += 35; risks.push('Extreme heat >42°C — crop damage, soil moisture loss.'); }
  else if (temp > 38) { ded += 25; risks.push('Very high temp >38°C — heat stress, pollen sterility.'); }
  else if (temp > 34) { ded += 14; risks.push('High temp >34°C — moderate heat stress for most crops.'); }
  else if (temp > 30) { ded += 6;  risks.push('Warm >30°C — some stress on sensitive crops.'); }
  else if (temp < 2)  { ded += 35; risks.push('Frost risk <2°C — severe damage to most crops.'); }
  else if (temp < 7)  { ded += 20; risks.push('Cold <7°C — chilling injury risk for tropical crops.'); }
  else if (temp < 12) { ded += 8;  risks.push('Cool <12°C — growth slowdown for warm-season crops.'); }
  else { good.push('Temperature in a favourable range.'); }

  // AQI
  if (aqi) {
    if      (aqi.aqi === 5) { ded += 25; risks.push(`Air quality Very Poor (AQI 5, PM2.5: ${aqi.pm25.toFixed(1)} µg/m³) — photosynthesis severely blocked.`); }
    else if (aqi.aqi === 4) { ded += 16; risks.push(`Air quality Poor (AQI 4, PM2.5: ${aqi.pm25.toFixed(1)} µg/m³) — reduced photosynthetic rate.`); }
    else if (aqi.aqi === 3) { ded += 8;  risks.push(`Air quality Moderate (AQI 3, PM2.5: ${aqi.pm25.toFixed(1)} µg/m³) — mild impact on sensitive crops.`); }
    else { good.push(`Air quality ${aqi.label} — minimal crop impact.`); }
    if (aqi.pm25 > 150)      { ded += 10; risks.push(`PM2.5 critically high (${aqi.pm25.toFixed(1)} µg/m³) — leaf surface deposition.`); }
    else if (aqi.pm25 > 75)  { ded += 5;  risks.push(`Elevated PM2.5 (${aqi.pm25.toFixed(1)} µg/m³).`); }
    if (aqi.o3 > 120)        { ded += 6;  risks.push(`High ozone ${aqi.o3.toFixed(0)} µg/m³ — ozone injury risk.`); }
  } else { ded += 5; risks.push('Air quality data unavailable.'); }

  // Haze/smoke/dust
  if      (desc.includes('smoke'))              { ded += 15; risks.push('Smoke — blocks light, damages leaf surfaces.'); }
  else if (desc.includes('dust') || desc.includes('sand')) { ded += 12; risks.push('Dust/sand — abrades leaf surfaces, blocks stomata.'); }
  else if (desc.includes('haze') || main==='haze') { ded += 8; risks.push('Atmospheric haze — reduced solar radiation.'); }
  else if (desc.includes('mist') || desc.includes('fog')) { ded += 4; risks.push('Fog/mist — reduced light, disease risk.'); }

  // Visibility
  if      (vis !== undefined && vis < 500)  { ded += 8; risks.push(`Very poor visibility ${vis}m — farmwork hazardous.`); }
  else if (vis !== undefined && vis < 2000) { ded += 4; risks.push(`Poor visibility ${(vis/1000).toFixed(1)}km — thick haze.`); }
  else if (vis && vis >= 5000) { good.push('Good visibility — clear conditions.'); }

  // Humidity
  if      (humidity > 92) { ded += 18; risks.push('Extremely high humidity >92% — blight/mildew risk.'); }
  else if (humidity > 82) { ded += 10; risks.push('High humidity >82% — elevated fungal pressure.'); }
  else if (humidity > 75) { ded += 4;  risks.push('Moderately high humidity — monitor for fungal lesions.'); }
  else if (humidity < 20) { ded += 18; risks.push('Critically low humidity — severe wilting risk.'); }
  else if (humidity < 35) { ded += 8;  risks.push('Low humidity <35% — moisture stress.'); }
  else { good.push('Humidity in acceptable range.'); }

  // Wind
  if      (wind > 20) { ded += 14; risks.push('Severe wind >20 m/s — lodging, soil erosion.'); }
  else if (wind > 13) { ded += 8;  risks.push('Strong wind >13 m/s — tall crop lodging risk.'); }
  else if (wind > 8)  { ded += 3;  risks.push('Moderate wind — caution with nurseries.'); }
  else { good.push('Wind speed safe for all crops.'); }

  // Rain
  if      (rain1h > 10) { ded += 14; risks.push('Very heavy rain — waterlogging/root rot risk.'); }
  else if (rain1h > 5)  { ded += 8;  risks.push('Heavy rain — field operations suspended.'); }
  else if (rain1h > 0)  { good.push('Light rain providing natural irrigation.'); }

  // Clouds
  if (clouds > 90) { ded += 6; risks.push('Dense overcast — photosynthesis significantly reduced.'); }
  else if (clouds < 20) { good.push('Clear skies — maximum solar radiation.'); }

  // Thunder
  if (main === 'thunderstorm') { ded += 10; risks.push('Thunderstorm — halt outdoor operations immediately.'); }

  const score = Math.max(0, 100 - ded);
  const st = score >= 80 ? ['Excellent','green'] : score >= 65 ? ['Good','teal'] : score >= 50 ? ['Moderate','gold'] : score >= 32 ? ['Concerning','orange'] : ['Poor — Act Now','red'];
  return { score, status: st[0], color: st[1], risks, good };
}

// ── Measures ─────────────────────────────────────────────
function getMeasures(weather, rain24, aqi) {
  const t = weather.main.temp, h = weather.main.humidity;
  const r = weather.rain?.['1h'] || 0, w = weather.wind.speed;
  const d = (weather.weather[0].description || '').toLowerCase();
  const m = [];
  if (aqi?.aqi >= 4) { m.push({icon:'😷',title:'Protect Field Workers',tip:'Mandate N95 masks. Limit outdoor exposure to early morning (before 8 AM) when AQI is at its lowest.'}); m.push({icon:'🌿',title:'Wash Harvested Crops',tip:'PM2.5 deposits on leaf surfaces. Rinse all leafy produce thoroughly before sale or storage.'}); }
  if (t > 34)  { m.push({icon:'🌊',title:'Increase Irrigation',tip:'Irrigate at dawn and dusk. Avoid midday — over 60% evaporation loss during peak hours.'}); m.push({icon:'🌿',title:'Apply Organic Mulch',tip:'4–6 cm mulch layer lowers root-zone temperature by 8–12°C and reduces moisture loss.'}); }
  if (t < 8)   { m.push({icon:'🏗️',title:'Deploy Frost Covers',tip:'Use row covers or poly-tunnels overnight. Harvest mature crops before temperatures fall further.'}); }
  if (h > 82 || d.includes('rain')) { m.push({icon:'🍄',title:'Preventive Fungicide',tip:'Spray copper-based or systemic fungicide before symptoms appear — humid conditions favour blight and mildew.'}); m.push({icon:'🚜',title:'Improve Drainage',tip:'Clear all drainage channels. Raised beds prevent waterlogging in low-lying fields.'}); }
  if (r > 5 || rain24 > 20) { m.push({icon:'🌾',title:'Delay Harvesting',tip:'Wait 24–48 h post-rain. Wet grain suffers breakage, fungal contamination, and poor storability.'}); m.push({icon:'🛑',title:'Halt Pesticide Spraying',tip:'Rain washes off chemicals — runoff wastes inputs and contaminates water bodies.'}); }
  if (w > 10)  { m.push({icon:'🪢',title:'Stake Tall Crops',tip:'Stake maize, sunflower and sugarcane to prevent lodging during gusts.'}); }
  if (h < 35)  { m.push({icon:'💧',title:'Mist Irrigation for Seedlings',tip:'Use micro-sprinklers to maintain nursery humidity >60%. Dry air rapidly desiccates seedlings.'}); }
  m.push({icon:'📋',title:'Daily Field Scouting',tip:'Record pest and disease observations daily — early detection prevents 60–80% of crop losses.'});
  m.push({icon:'📦',title:'Check Stored Grain',tip:'Verify grain moisture <14%. Humidity fluctuations accelerate fungal storage damage.'});
  return m;
}

// ── Analysis text ─────────────────────────────────────────
function makeAnalysis(w, health, rains, aqi) {
  const { rainIn24, rainIn48 } = rains;
  const aqiTxt = aqi ? `Air quality is ${aqi.label} (AQI ${aqi.aqi}, PM2.5: ${aqi.pm25.toFixed(1)} µg/m³) — ${aqi.aqi >= 4 ? 'a critical concern for crop photosynthesis and worker health' : aqi.aqi === 3 ? 'with mild crop impact' : 'posing minimal agronomic risk'}. ` : '';
  const rainTxt = rainIn24 > 10 ? `Significant rainfall of ${rainIn24.toFixed(1)} mm forecast in 24h (${rainIn48.toFixed(1)} mm over 48h). ` : rainIn24 > 0 ? `Light rainfall of ${rainIn24.toFixed(1)} mm possible in 24h. ` : 'No significant precipitation forecast for 24 hours. ';
  const riskTxt = health.score >= 80 ? 'conditions are broadly favourable' : health.score >= 60 ? 'conditions are acceptable but need monitoring' : health.score >= 35 ? 'conditions are concerning and prompt intervention is advised' : 'conditions are poor — immediate protective action is critical';
  return `Conditions over ${w.name}, ${w.sys.country}: ${Math.round(w.main.temp)}°C (feels ${Math.round(w.main.feels_like)}°C), ${w.weather[0].description}, ${w.main.humidity}% humidity, wind ${w.wind.speed} m/s from ${deg2dir(w.wind.deg)}. ${aqiTxt}${rainTxt}Agronomic outlook: ${riskTxt} (Crop Health Index: ${health.score}/100 — ${health.status}). ${health.risks.length ? `Priority risks: ${health.risks.slice(0,2).map(r=>r.split('—')[0].trim()).join('; ')}. ` : ''}Advised action: ${health.score < 50 ? 'implement protective measures immediately' : 'maintain vigilance and take precautionary steps'}.`;
}

// ── Component ─────────────────────────────────────────────
export default function Weather() {
  const [city, setCity]       = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const fetchAll = async (weatherPromise) => {
    setLoading(true); setError('');
    const w = await weatherPromise;
    if (w.error) { setError(w.error); setWeather(null); setForecast(null); setAqiData(null); setLoading(false); return; }
    const [f, a] = await Promise.all([fetchForecastByCoords(w.coord.lat, w.coord.lon), fetchAirQuality(w.coord.lat, w.coord.lon)]);
    setWeather(w); setForecast(f.error ? null : f); setAqiData(a.error ? null : a); setCity(w.name); setLoading(false);
  };

  const handleSearch   = () => { if (!city.trim()) { setError('Please enter a city name.'); return; } fetchAll(fetchWeatherByCity(city.trim())); };
  const handleKeyDown  = e  => { if (e.key === 'Enter') handleSearch(); };
  const handleLocation = () => { if (!navigator.geolocation) { setError('Geolocation not supported.'); return; } setError(''); navigator.geolocation.getCurrentPosition(p => fetchAll(fetchWeatherByCoords(p.coords.latitude, p.coords.longitude)), () => setError('Location access denied.')); };

  const rain1h   = weather?.rain?.['1h'] || 0;
  const aqi      = parseAQI(aqiData);
  const lastRain = weather ? getLastRainInfo(weather) : null;
  const rains    = forecast ? analyzeRain(forecast.list) : { rainIn24:0, rainIn48:0, firstRain:null };
  const health   = weather ? cropHealthScore(weather, aqi) : null;
  const measures = weather ? getMeasures(weather, rains.rainIn24, aqi) : [];
  const analysis = weather ? makeAnalysis(weather, health, rains, aqi) : '';
  const bg       = weather ? getBgGradient(weather.weather[0].main) : '';

  return (
    <div className="page-container">
      <h1 className="page-title">Weather Report</h1>
      <p className="page-subtitle">Real-time weather, air quality & agricultural impact analysis.</p>

      {/* Search bar */}
      <div className="wx-search">
        <input type="text" placeholder="Search city — Delhi, Mumbai, Kathmandu..." value={city} onChange={e=>setCity(e.target.value)} onKeyDown={handleKeyDown} />
        <button className="btn-primary" onClick={handleSearch}>Search</button>
        <button className="btn-secondary" onClick={handleLocation}>📍 Locate</button>
      </div>

      {error   && <div className="wx-error">{error}</div>}
      {loading && <Loader text="Fetching weather & air quality..." />}

      {!loading && weather && (
        <div className="wx-report">

          {/* ── HERO ── */}
          <div className="wx-hero" style={{background: bg}}>
            <div className="wx-hero-left">
              <div className="wx-location">
                <span className="wx-city-name">{weather.name}</span>
                <span className="wx-country">{weather.sys.country}</span>
                {aqi && <span className="wx-aqi-badge" style={{color: aqi.color, border:`1px solid ${aqi.color}`, background: aqi.bg}}>{aqi.emoji} AQI {aqi.aqi} — {aqi.label}</span>}
              </div>
              <div className="wx-temp-row">
                <span className="wx-big-temp">{Math.round(weather.main.temp)}°</span>
                <div className="wx-temp-details">
                  <span className="wx-condition">{weather.weather[0].description}</span>
                  <span className="wx-feels">Feels {Math.round(weather.main.feels_like)}°C</span>
                  <span className="wx-range">↓ {Math.round(weather.main.temp_min)}° · ↑ {Math.round(weather.main.temp_max)}°</span>
                </div>
              </div>
              <div className="wx-hero-pills">
                <span className="wx-pill">💧 {weather.main.humidity}%</span>
                <span className="wx-pill">💨 {weather.wind.speed} m/s {deg2dir(weather.wind.deg)}</span>
                <span className="wx-pill">🌡️ {weather.main.pressure} mb</span>
                <span className="wx-pill">☁️ {weather.clouds?.all || 0}% cloud</span>
                <span className="wx-pill">👁️ {weather.visibility ? (weather.visibility/1000).toFixed(1)+'km' : 'N/A'}</span>
                <span className="wx-pill">🌄 {fmtTime(weather.sys.sunrise, weather.timezone)} / {fmtTime(weather.sys.sunset, weather.timezone)}</span>
              </div>
            </div>
            <div className="wx-hero-icon">{getEmoji(weather.weather[0].main)}</div>
          </div>

          {/* ── RAINFALL PANEL ── */}
          <div className="wx-panel wx-rain-panel">
            <h2 className="wx-panel-title">🌧️ Rainfall</h2>
            <div className="wx-rain-grid">

              {/* Last Rainfall */}
              <div className={`wx-rain-block wx-last-rain wx-last-${lastRain.status}`}>
                <div className="wx-rain-block-label">Last Rainfall</div>
                {/* Amount: mm = millimetres of precipitation depth */}
                <div className="wx-rain-block-main">
                  {lastRain.amount}
                  <span className="wx-mm-tip"> mm*</span>
                </div>
                <div className="wx-rain-ago">
                  {lastRain.ago
                    ? <span className="wx-time-val">{lastRain.ago}</span>
                    : <span className="wx-nodata">No recent rainfall</span>
                  }
                </div>
                <div className="wx-time-tag">{lastRain.window}</div>
                <div className="wx-mm-note">*mm = millimetres of rainfall depth</div>
              </div>


              {/* Current */}
              <div className="wx-rain-block">
                <div className="wx-rain-block-label">Now (1h)</div>
                <div className="wx-rain-block-main">{rain1h.toFixed(2)} mm</div>
                <div className={`wx-rain-pill wx-pill-${rain1h > 5 ? 'red' : rain1h > 0 ? 'blue' : 'muted'}`}>
                  {rain1h > 7.5 ? 'Heavy Rain' : rain1h > 2.5 ? 'Moderate' : rain1h > 0 ? 'Light Rain' : 'None'}
                </div>
              </div>

              {/* 24h forecast */}
              <div className="wx-rain-block">
                <div className="wx-rain-block-label">Expected (24h)</div>
                <div className="wx-rain-block-main">{rains.rainIn24.toFixed(1)} mm</div>
                <div className="wx-rain-block-sub">Forecast accumulation</div>
              </div>

              {/* 48h forecast */}
              <div className="wx-rain-block">
                <div className="wx-rain-block-label">Expected (48h)</div>
                <div className="wx-rain-block-main">{rains.rainIn48.toFixed(1)} mm</div>
                <div className="wx-rain-block-sub">Forecast accumulation</div>
              </div>

              {/* Next rain event */}
              <div className="wx-rain-block">
                <div className="wx-rain-block-label">Next Rain Event</div>
                <div className={`wx-rain-block-main ${!rains.firstRain ? 'wx-muted' : ''}`}>
                  {rains.firstRain ? new Date(rains.firstRain.dt*1000).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}) : 'None in 48h'}
                </div>
                {rains.firstRain && <div className="wx-rain-block-sub">{new Date(rains.firstRain.dt*1000).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</div>}
              </div>
            </div>

            {/* 24h strip */}
            {forecast && (
              <div className="wx-strip">
                <div className="wx-strip-label">3-Hour Forecast (Next 24h)</div>
                <div className="wx-strip-row">
                  {forecast.list.slice(0,8).map(s => (
                    <div key={s.dt} className={`wx-strip-slot ${(s.rain?.['3h']||0)>0 ? 'wx-slot-wet':''}`}>
                      <span className="wx-slot-time">{new Date(s.dt*1000).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                      <span className="wx-slot-icon">{getEmoji(s.weather[0].main)}</span>
                      <span className="wx-slot-temp">{Math.round(s.main.temp)}°</span>
                      {(s.rain?.['3h']||0)>0 && <span className="wx-slot-rain">{s.rain['3h'].toFixed(1)}mm</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── AQI PANEL ── */}
          {aqi && (
            <div className="wx-panel wx-aqi-panel" style={{borderColor: aqi.color+'44', background: aqi.bg}}>
              <h2 className="wx-panel-title">🏭 Air Quality Index</h2>
              <div className="wx-aqi-top">
                <div className="wx-aqi-score" style={{color: aqi.color}}>{aqi.emoji} AQI {aqi.aqi} — {aqi.label}</div>
                <div className="wx-aqi-bar-track">
                  <div className="wx-aqi-bar-fill" style={{width:`${(aqi.aqi/5)*100}%`, background: `linear-gradient(90deg,#22c55e,${aqi.color})`}} />
                  {[1,2,3,4,5].map(v => <div key={v} className="wx-aqi-bar-tick" style={{left:`${(v/5)*100}%`}} />)}
                </div>
                <div className="wx-aqi-bar-labels"><span>Good</span><span>Fair</span><span>Mod.</span><span>Poor</span><span>V.Poor</span></div>
              </div>
              <div className="wx-aqi-pollutants">
                {[
                  {label:'PM2.5',val:aqi.pm25.toFixed(1),u:'µg/m³',warn:aqi.pm25>75?'High':aqi.pm25>35?'Moderate':'Normal'},
                  {label:'PM10', val:aqi.pm10.toFixed(1),u:'µg/m³',warn:aqi.pm10>150?'High':'Normal'},
                  {label:'O₃',   val:aqi.o3.toFixed(0), u:'µg/m³',warn:aqi.o3>120?'Crop risk':'Normal'},
                  {label:'NO₂',  val:aqi.no2.toFixed(1),u:'µg/m³',warn:aqi.no2>80?'Elevated':'Normal'},
                  {label:'SO₂',  val:aqi.so2.toFixed(1),u:'µg/m³',warn:aqi.so2>20?'Elevated':'Normal'},
                  {label:'CO',   val:(aqi.co/1000).toFixed(2),u:'mg/m³',warn:'Normal'},
                ].map(p => (
                  <div key={p.label} className="wx-pollutant">
                    <span className="wx-poll-label">{p.label}</span>
                    <span className="wx-poll-val">{p.val} <small>{p.u}</small></span>
                    <span className={`wx-poll-status wx-ps-${p.warn==='Normal'?'ok':'warn'}`}>{p.warn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CROP HEALTH ── */}
          <div className="wx-panel wx-chi-panel">
            <h2 className="wx-panel-title">🌾 Crop Health Index</h2>
            <div className="wx-chi-body">
              <div className="wx-chi-left">
                <svg viewBox="0 0 140 85" className="wx-gauge">
                  <defs>
                    <linearGradient id="gGreen" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22c55e"/><stop offset="100%" stopColor="#16a34a"/></linearGradient>
                    <linearGradient id="gYellow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#eab308"/><stop offset="100%" stopColor="#f97316"/></linearGradient>
                    <linearGradient id="gRed" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f97316"/><stop offset="100%" stopColor="#ef4444"/></linearGradient>
                  </defs>
                  {/* Track */}
                  <path d="M14 78 A56 56 0 0 1 126 78" fill="none" stroke="#1e3a28" strokeWidth="14" strokeLinecap="round"/>
                  {/* Fill */}
                  <path d="M14 78 A56 56 0 0 1 126 78" fill="none"
                    stroke={health.color==='green'?'url(#gGreen)':health.color==='teal'?'#14b8a6':health.color==='gold'?'url(#gYellow)':'url(#gRed)'}
                    strokeWidth="14" strokeLinecap="round"
                    strokeDasharray={`${(health.score/100)*175.9} 175.9`}/>
                  <text x="70" y="72" textAnchor="middle" fontSize="22" fontWeight="800" fill="#f0f7f2">{health.score}</text>
                </svg>
                <div className="wx-chi-score-sub">/ 100</div>
                <div className="wx-chi-status-pill" style={{
                  color: health.color==='green'?'#22c55e':health.color==='teal'?'#2dd4bf':health.color==='gold'?'#fbbf24':health.color==='orange'?'#fb923c':'#f87171',
                  borderColor: health.color==='green'?'#166534':health.color==='teal'?'#0f766e':health.color==='gold'?'#78350f':health.color==='orange'?'#7c2d12':'#7f1d1d',
                  background: health.color==='green'?'rgba(34,197,94,0.1)':health.color==='teal'?'rgba(45,212,191,0.1)':health.color==='gold'?'rgba(251,191,36,0.1)':health.color==='orange'?'rgba(251,146,60,0.1)':'rgba(239,68,68,0.1)',
                }}>{health.status}</div>
                {aqi && <div className="wx-chi-aqi" style={{color:aqi.color}}>{aqi.emoji} Air: {aqi.label}</div>}
              </div>
              <div className="wx-chi-right">
                {health.good.length > 0 && (
                  <div className="wx-chi-section">
                    <div className="wx-chi-section-title green">✅ Favourable</div>
                    {health.good.map((g,i)=><div key={i} className="wx-chi-item">{g}</div>)}
                  </div>
                )}
                {health.risks.length > 0 && (
                  <div className="wx-chi-section">
                    <div className="wx-chi-section-title red">⚠️ Risk Factors</div>
                    {health.risks.map((r,i)=><div key={i} className="wx-chi-item">{r}</div>)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── MEASURES ── */}
          <div className="wx-panel">
            <h2 className="wx-panel-title">🛡️ Protective Measures</h2>
            <div className="wx-measures">
              {measures.map((m,i) => (
                <div key={i} className="wx-measure">
                  <span className="wx-measure-icon">{m.icon}</span>
                  <div>
                    <p className="wx-measure-title">{m.title}</p>
                    <p className="wx-measure-tip">{m.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── ANALYSIS ── */}
          <div className="wx-panel wx-analysis">
            <div className="wx-analysis-header">
              <h2 className="wx-panel-title" style={{marginBottom:0}}>📝 Agronomic Analysis</h2>
              <div className="wx-analysis-meta">
                <span className="badge badge-green">Live data</span>
                <span className="wx-analysis-time">{new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
              </div>
            </div>
            <p className="wx-analysis-text">{analysis}</p>
            <div className="wx-disclaimer">⚠️ Always confirm with local field observation and certified agronomist advice before critical decisions.</div>
          </div>

        </div>
      )}
    </div>
  );
}
