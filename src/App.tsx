import { lazy, Suspense } from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSkeleton } from './components/ui/LoadingSkeleton';

// Lazy loading for code splitting — reduces initial bundle size
const PortfolioDashboard = lazy(() => import('./pages/PortfolioDashboard'));
const DividendTracker = lazy(() => import('./pages/DividendTracker'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const InvestmentHistory = lazy(() => import('./pages/InvestmentHistory'));
const PerformanceAnalytics = lazy(() => import('./pages/PerformanceAnalytics'));
const RebalancingAlerts = lazy(() => import('./pages/RebalancingAlerts'));
const Settings = lazy(() => import('./pages/Settings'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Watchlist = lazy(() => import('./pages/Watchlist'));

function PageFallback() {
  return (
    <div className="space-y-4 p-4">
      <LoadingSkeleton className="h-24 w-full" />
      <LoadingSkeleton className="h-64 w-full" />
      <LoadingSkeleton className="h-48 w-full" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/portfolio" replace />} />
          <Route path="portfolio" element={<Suspense fallback={<PageFallback />}><PortfolioDashboard /></Suspense>} />
          <Route path="dividends" element={<Suspense fallback={<PageFallback />}><DividendTracker /></Suspense>} />
          <Route path="recommendations" element={<Suspense fallback={<PageFallback />}><Recommendations /></Suspense>} />
          <Route path="history" element={<Suspense fallback={<PageFallback />}><InvestmentHistory /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<PageFallback />}><PerformanceAnalytics /></Suspense>} />
          <Route path="rebalancing" element={<Suspense fallback={<PageFallback />}><RebalancingAlerts /></Suspense>} />
          <Route path="alerts" element={<Suspense fallback={<PageFallback />}><Alerts /></Suspense>} />
          <Route path="watchlist" element={<Suspense fallback={<PageFallback />}><Watchlist /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
