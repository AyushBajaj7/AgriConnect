/**
 * File: App.js
 * Description: Root component defining client-side routing.
 *              ProtectedRoute redirects unauthenticated users to /login.
 * Used in: index.js
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './services/authService';

import Navbar  from './components/Navbar/Navbar';
import Footer  from './components/Footer/Footer';
import Chatbot from './components/Chatbot/Chatbot';

import Login             from './pages/Login/Login';
import Dashboard         from './pages/Dashboard/Dashboard';
import GovernmentSchemes from './pages/GovernmentSchemes/GovernmentSchemes';
import SchemeDetails     from './pages/SchemeDetails/SchemeDetails';
import CropPrices        from './pages/CropPrices/CropPrices';
import FarmingTools      from './pages/FarmingTools/FarmingTools';
import Weather           from './pages/Weather/Weather';

/**
 * Route guard — redirects to /login if not authenticated.
 * Wraps every protected page in AppLayout.
 */
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/"            element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"   element={<Dashboard />}         />
          <Route path="/schemes"     element={<GovernmentSchemes />}  />
          <Route path="/scheme/:id"  element={<SchemeDetails />}      />
          <Route path="/crop-prices" element={<CropPrices />}         />
          <Route path="/tools"       element={<FarmingTools />}        />
          <Route path="/weather"     element={<Weather />}            />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;