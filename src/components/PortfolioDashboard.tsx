import { useQuery } from '@tanstack/react-query'
import { portfolioService } from '@/services/portfolioService'
import { marketService } from '@/services/marketService'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency, formatPct, gainLossClass } from '@/utils/format'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export function PortfolioDashboard() {
  const { data: marketStatus } = useQuery({
    queryKey: ['market-status'],
    queryFn: marketService.getStatus,
    refetchInterval: 60_000,
  })

  const isMarketOpen = marketStatus?.is_open ?? false

  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['portfolio-dashboard'],
    queryFn: portfolioService.getDashboard,
    refetchInterval: isMarketOpen ? REFRESH_INTERVAL_MS : false,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !dashboard) {
    return <ErrorMessage message="No se pudo cargar el portfolio." />
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Valor Total"
          value={formatCurrency(dashboard.total_value)}
          className="col-span-2"
        />
        <StatCard
          label="Ganancia/Pérdida"
          value={formatCurrency(dashboard.total_gain_loss)}
          subValue={formatPct(dashboard.total_gain_loss_pct)}
          valueClassName={gainLossClass(dashboard.total_gain_loss)}
        />
        <StatCard
          label="Coste Base"
          value={formatCurrency(dashboard.total_cost_basis)}
        />
      </div>

      {/* Market status badge */}
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${isMarketOpen ? 'bg-gain animate-pulse' : 'bg-text-disabled'}`}
        />
        <span className="text-xs text-text-secondary">
          {isMarketOpen ? 'Mercado abierto · actualiza cada 5 min' : 'Mercado cerrado'}
        </span>
      </div>

      {/* Holdings table */}
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">
            Posiciones ({dashboard.holdings.length})
          </h2>
        </div>
        <div className="divide-y divide-border">
          {dashboard.holdings.map((h) => (
            <div key={h.ticker} className="px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-text-primary text-sm">{h.ticker}</span>
                <span className="text-xs text-text-secondary">
                  {h.shares.toFixed(4)} acc · {h.allocation_pct.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono text-sm text-text-primary">
                  {formatCurrency(h.market_value)}
                </span>
                <span className={`text-xs font-mono ${gainLossClass(h.gain_loss_pct)}`}>
                  {formatPct(h.gain_loss_pct)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-disabled text-center">
        Actualizado: {new Date(dashboard.last_updated).toLocaleTimeString('es-ES')}
      </p>
    </div>
  )
}
