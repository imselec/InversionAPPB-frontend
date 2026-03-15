import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { portfolioService } from '@/services/portfolioService'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatCurrency, formatDate } from '@/utils/format'

export function InvestmentHistory() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['portfolio-history', startDate, endDate],
    queryFn: () =>
      portfolioService.getHistory({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  })

  const totalInvested = transactions
    ?.filter((t) => t.action === 'BUY')
    .reduce((sum, t) => sum + t.total_amount, 0) ?? 0

  if (isLoading) return <div className="flex justify-center h-40 items-center"><Spinner size="lg" /></div>
  if (error) return <ErrorMessage message="No se pudo cargar el historial." />

  return (
    <div className="space-y-4">
      {/* Date filters */}
      <div className="card flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-text-secondary block mb-1">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary w-full
                       focus:outline-none focus:border-accent text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-text-secondary block mb-1">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary w-full
                       focus:outline-none focus:border-accent text-sm"
          />
        </div>
      </div>

      <div className="card">
        <span className="text-xs text-text-secondary">Total invertido</span>
        <div className="font-mono text-xl font-semibold mt-1">{formatCurrency(totalInvested)}</div>
      </div>

      {/* Transactions list */}
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Transacciones ({transactions?.length ?? 0})</h2>
        </div>
        {!transactions || transactions.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">Sin transacciones</p>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((t) => (
              <div key={t.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{t.ticker}</span>
                    <span className={`badge-${t.action === 'BUY' ? 'gain' : 'loss'}`}>{t.action}</span>
                  </div>
                  <div className="text-xs text-text-secondary">{formatDate(t.date)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{formatCurrency(t.total_amount)}</div>
                  <div className="text-xs text-text-secondary">
                    {t.shares.toFixed(4)} @ {formatCurrency(t.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
