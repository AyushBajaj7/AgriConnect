import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import PageFallback from "./PageFallback";
import ErrorBoundary from "../ErrorBoundary/ErrorBoundary";

const Chatbot = lazy(() => import("../Chatbot/Chatbot"));
const Dashboard = lazy(() => import("../../pages/Dashboard/Dashboard"));
const GovernmentSchemes = lazy(() => import("../../pages/GovernmentSchemes/GovernmentSchemes"));
const SchemeDetails = lazy(() => import("../../pages/SchemeDetails/SchemeDetails"));
const CropPrices = lazy(() => import("../../pages/CropPrices/CropPrices"));
const FarmingTools = lazy(() => import("../../pages/FarmingTools/FarmingTools"));
const Weather = lazy(() => import("../../pages/Weather/Weather"));

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <ErrorBoundary>
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
        </ErrorBoundary>
      </main>
      <Footer />
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Chatbot />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default AppLayout;
