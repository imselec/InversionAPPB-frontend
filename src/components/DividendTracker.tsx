import { useQuery } from '@tanstack/react-query'
import { dividendService } from '@/services/dividendService'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

export function DividendTracker() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dividends-summary'],
    queryFn: dividendService.getSummary,
  })
  const { data: byTicker, isLoading: loadingTickers } = useQuery({
    queryKey: ['dividends-by-ticker'],
    queryFn: dividendService.getByTicker,
  })
  const { data: chart } = useQuery({
    queryKey: ['dividends-chart'],
    queryFn: dividendService.getChart,
  })
  const { data: history } = useQuery({
    queryKey: ['dividends-history'],
    queryFn: dividendService.getHistory,
  })

  if (loadingSummary || loadingTickers) {
    return <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
  }

  if (!summary) return <ErrorMessage message="No se pudieron cargar los dividendos." />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Dividendos este mes" value={formatCurrency(summary.monthly_total)} />
        <StatCard label="Dividendos este año" value={formatCurrency(summary.yearly_total)} />
      </div>

      {/* Chart */}
      {chart && chart.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold mb-3">Ingresos por dividendo</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#8B8FA8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8B8FA8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1A1D27', border: '1px solid #2A2D3E', borderRadius: 8 }}
                labelStyle={{ color: '#F0F2FF' }}
                formatter={(v: number) => [formatCurrency(v), 'Dividendo']}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chart.map((_, i) => (
                  <Cell key={i} fill="#00D4AA" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By ticker */}
      {byTicker && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Yield por acción</h2>
          </div>
          <div className="divide-y divide-border">
            {byTicker.map((d) => (
              <div key={d.ticker} className="px-4 py-3 flex justify-between items-center">
                <span className="font-semibold text-sm">{d.ticker}</span>
                <div className="text-right">
                  <div className="text-gain font-mono text-sm">{(d.yield_pct * 100).toFixed(2)}%</div>
                  <div className="text-xs text-text-secondary">{formatCurrency(d.annual_amount)}/año</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent payments */}
      {history && history.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Pagos recientes</h2>
          </div>
          <div className="divide-y divide-border">
            {history.slice(0, 10).map((p) => (
              <div key={p.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-sm">{p.ticker}</span>
                  <div className="text-xs text-text-secondary">{formatDate(p.payment_date)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-gain">{formatCurrency(p.amount)}</div>
                  {p.reinvested && <span className="badge-accent">Reinvertido</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
