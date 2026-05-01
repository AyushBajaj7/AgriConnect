/**
 * File: App.js
 * Description: Root component defining authenticated and guest routes.
 * Used in: index.js
 */

import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Loader from "./components/Loader/Loader";

const Chatbot = lazy(() => import("./components/Chatbot/Chatbot"));
const Login = lazy(() => import("./pages/Login/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const GovernmentSchemes = lazy(
  () => import("./pages/GovernmentSchemes/GovernmentSchemes"),
);
const SchemeDetails = lazy(
  () => import("./pages/SchemeDetails/SchemeDetails"),
);
const CropPrices = lazy(() => import("./pages/CropPrices/CropPrices"));
const FarmingTools = lazy(() => import("./pages/FarmingTools/FarmingTools"));
const Weather = lazy(() => import("./pages/Weather/Weather"));

function PageFallback({ text }) {
  return (
    <div className="page-container">
      <Loader text={text} />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return <PageFallback text="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return <PageFallback text="Loading sign-in..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<PageFallback text="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schemes" element={<GovernmentSchemes />} />
            <Route path="/scheme/:id" element={<SchemeDetails />} />
            <Route path="/crop-prices" element={<CropPrices />} />
            <Route path="/tools" element={<FarmingTools />} />
            <Route path="/weather" element={<Weather />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </>
  );
}

function AppRoutes() {
  return (
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
