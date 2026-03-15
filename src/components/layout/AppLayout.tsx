import { NavLink, Outlet } from 'react-router-dom';
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
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary pb-20 md:pb-0 md:pt-20">
      
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
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 md:hidden">
        <ul className="flex items-center overflow-x-auto overflow-y-hidden no-scrollbar px-2">
          {navItems.map((item) => (
            <li key={item.path} className="flex-shrink-0 flex-1 min-w-[72px]">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center h-[60px] gap-1 min-h-[44px] min-w-[44px] p-1 transition-colors',
                    isActive ? 'text-primary' : 'text-text-muted hover:text-text-primary'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Side Navigation (Desktop - Optional enhancement for larger screens) */}
      <nav className="hidden md:flex fixed top-16 left-0 bottom-0 w-64 bg-surface border-r border-border flex-col py-4 z-40">
        <ul className="flex flex-col gap-2 px-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
    </div>
  );
}
