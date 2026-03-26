/**
 * File: Loader.js
 * Description: Full-width loading spinner with an optional status message.
 *              Displayed while async operations (API fetches) are in progress.
 *
 * Props:
 *   text {string} — Loading message shown below the spinner.
 *                   Defaults to 'Loading…' if not provided.
 *
 * Used in: pages/Weather/Weather.js
 */

import React from 'react';
import './Loader.css';

function Loader({ text = 'Loading…' }) {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className="loader-spinner" aria-hidden="true" />
      <p className="loader-text">{text}</p>
    </div>
  );
}

export default Loader;
