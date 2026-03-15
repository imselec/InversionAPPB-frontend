import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/analyticsService'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency, formatPct, gainLossClass } from '@/utils/format'
import { cn } from '@/utils/cn'

const PERIODS = ['1M', '3M', '6M', '1Y', 'All'] as const
type Period = (typeof PERIODS)[number]

export function PerformanceAnalytics() {
  const [period, setPeriod] = useState<Period>('1Y')

  const { data: perf, isLoading, error } = useQuery({
    queryKey: ['analytics-performance', period],
    queryFn: () => analyticsService.getPerformance(period),
  })

  const { data: returns } = useQuery({
    queryKey: ['analytics-returns'],
    queryFn: analyticsService.getReturns,
  })

  if (isLoading) return <div className="flex justify-center h-40 items-center"><Spinner size="lg" /></div>
  if (error || !perf) return <ErrorMessage message="No se pudieron cargar los analytics." />

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
              period === p
                ? 'bg-accent text-white'
                : 'bg-bg-surface text-text-secondary hover:text-text-primary',
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Retorno total"
          value={formatPct(perf.total_return_pct)}
          valueClassName={gainLossClass(perf.total_return_pct)}
        />
        <StatCard
          label="Retorno anualizado"
          value={formatPct(perf.annualized_return_pct)}
          valueClassName={gainLossClass(perf.annualized_return_pct)}
        />
        <StatCard
          label="Yield dividendos"
          value={formatPct(perf.portfolio_yield_pct)}
          valueClassName="text-gain"
        />
        <StatCard
          label="Volatilidad"
          value={formatPct(perf.volatility)}
        />
        <StatCard
          label="vs S&P 500"
          value={formatPct(perf.sp500_comparison)}
          valueClassName={gainLossClass(perf.sp500_comparison)}
          className="col-span-2"
        />
      </div>

      {/* Per-ticker returns */}
      {returns && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Retorno por acción</h2>
          </div>
          <div className="divide-y divide-border">
            {returns
              .sort((a, b) => b.total_return_pct - a.total_return_pct)
              .map((r) => (
                <div key={r.ticker} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-sm">{r.ticker}</span>
                    <div className="text-xs text-text-secondary">
                      Coste: {formatCurrency(r.cost_basis)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-sm ${gainLossClass(r.total_return_pct)}`}>
                      {formatPct(r.total_return_pct)}
                    </div>
                    <div className={`text-xs font-mono ${gainLossClass(r.gain_loss)}`}>
                      {formatCurrency(r.gain_loss)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
