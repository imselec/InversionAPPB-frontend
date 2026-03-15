import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  History,
  BarChart2,
  Scale,
  Bell,
  Bookmark,
  Settings,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Portfolio' },
  { to: '/dividends', icon: TrendingUp, label: 'Dividendos' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recomend.' },
  { to: '/history', icon: History, label: 'Historial' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/rebalancing', icon: Scale, label: 'Balance' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
  { to: '/settings', icon: Settings, label: 'Config' },
]

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-accent font-semibold text-lg tracking-tight">InversionAPP</span>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom navigation — mobile first */}
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 left-0 right-0 z-40 bg-bg-surface border-t border-border
                   flex items-center justify-around px-1 pb-safe"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg min-w-[44px] min-h-[44px] justify-center',
                'text-xs transition-colors duration-150',
                isActive
                  ? 'text-accent'
                  : 'text-text-disabled hover:text-text-secondary',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span className="leading-none">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
