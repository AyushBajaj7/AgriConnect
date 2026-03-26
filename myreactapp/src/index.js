/**
 * File: index.js
 * Description: Application entry point. Mounts the React component tree
 *              into the DOM root element and wraps the app in StrictMode
 *              for development-time warnings.
 * Used in: Bootstrapped automatically by Create React App via public/index.html.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
