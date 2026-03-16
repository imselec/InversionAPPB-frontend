import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  Clock,
  BarChart2,
  Scale,
  Settings,
  Bell,
  Bookmark
} from 'lucide-react';
import { cn } from '../../utils/utils';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { OfflineIndicator } from '../ui/OfflineIndicator';

const navItems = [
  { path: '/portfolio', label: 'Portfolio', icon: LayoutDashboard },
  { path: '/dividends', label: 'Dividends', icon: TrendingUp },
  { path: '/recommendations', label: 'Recomms', icon: Lightbulb },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/rebalancing', label: 'Rebalance', icon: Scale },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary pb-20 md:pb-0 md:pt-20" style={{ WebkitOverflowScrolling: 'touch' }}>
      <OfflineIndicator />
      
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border flex items-center justify-between px-4 z-50">
        <h1 className="text-xl font-bold">Investment Advisor</h1>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
          OPEN
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 mt-16 md:mt-0 mb-16 md:mb-0 overflow-x-hidden">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation (Mobile) — always visible on small screens */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-[9999] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <ul className="flex items-center overflow-x-auto overflow-y-hidden no-scrollbar px-1">
          {navItems.map((item) => (
            <li key={item.path} className="flex-shrink-0 flex-1 min-w-[60px]">
              <button
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-[56px] gap-0.5 p-1 transition-colors',
                  isActive(item.path) ? 'text-primary' : 'text-text-muted'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[9px] font-medium truncate w-full text-center leading-tight">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Side Navigation (Desktop) */}
      <nav className="hidden md:flex fixed top-16 left-0 bottom-0 w-64 bg-surface border-r border-border flex-col py-4 z-40">
        <ul className="flex flex-col gap-2 px-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors font-medium',
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
    </div>
  );
}
