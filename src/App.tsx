import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

// Lazy loading could be used here to optimize bundle size
import PortfolioDashboard from './pages/PortfolioDashboard';
import DividendTracker from './pages/DividendTracker';
import Recommendations from './pages/Recommendations';
import InvestmentHistory from './pages/InvestmentHistory';
import PerformanceAnalytics from './pages/PerformanceAnalytics';
import RebalancingAlerts from './pages/RebalancingAlerts';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import Watchlist from './pages/Watchlist';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/portfolio" replace />} />
          <Route path="portfolio" element={<PortfolioDashboard />} />
          <Route path="dividends" element={<DividendTracker />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="history" element={<InvestmentHistory />} />
          <Route path="analytics" element={<PerformanceAnalytics />} />
          <Route path="rebalancing" element={<RebalancingAlerts />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
