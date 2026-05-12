/**
 * File: App.js
 * Description: Root component defining authenticated and guest routes.
 * Used in: index.js
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/Routes/ProtectedRoute";
import GuestRoute from "./components/Routes/GuestRoute";
import AppLayout from "./components/Layout/AppLayout";
import PageFallback from "./components/Layout/PageFallback";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

const Login = lazy(() => import("./pages/Login/Login"));

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback text="Loading AgriConnect..." />}>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <div className="app-container">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
