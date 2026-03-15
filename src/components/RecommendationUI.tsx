import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recommendationService } from '@/services/recommendationService'
import { settingsService } from '@/services/settingsService'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatCurrency } from '@/utils/format'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

export function RecommendationUI() {
  const qc = useQueryClient()
  const { data: budgetData } = useQuery({
    queryKey: ['budget'],
    queryFn: settingsService.getBudget,
  })
  const [budget, setBudget] = useState<number | null>(null)
  const effectiveBudget = budget ?? budgetData?.monthly_budget ?? 300

  const { data: latest, isLoading } = useQuery({
    queryKey: ['recommendations-latest'],
    queryFn: recommendationService.getLatest,
  })

  const { data: sellRecs } = useQuery({
    queryKey: ['recommendations-sell'],
    queryFn: recommendationService.getSell,
  })

  const generateMutation = useMutation({
    mutationFn: () => recommendationService.generate(effectiveBudget),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations-latest'] }),
  })

  if (isLoading) return <div className="flex justify-center h-40 items-center"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      {/* Budget control */}
      <div className="card flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-text-secondary block mb-1">Presupuesto mensual</label>
          <input
            type="number"
            min={50}
            step={50}
            value={effectiveBudget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary
                       font-mono w-full focus:outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="btn-primary flex items-center gap-2 mt-4"
        >
          {generateMutation.isPending ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
          Generar
        </button>
      </div>

      {generateMutation.isError && <ErrorMessage message="Error generando recomendaciones." />}

      {/* Buy recommendations */}
      {latest && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gain" /> Comprar
            </h2>
            <span className="text-xs text-text-secondary">
              Total: {formatCurrency(latest.total_allocated)} / {formatCurrency(latest.budget)}
            </span>
          </div>
          <div className="divide-y divide-border">
            {latest.recommendations
              .filter((r) => r.action === 'BUY')
              .map((r) => (
                <div key={r.ticker} className="px-4 py-3 border-l-2 border-l-accent">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold">{r.ticker}</span>
                      <span className="text-xs text-text-secondary ml-2">#{r.priority}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{formatCurrency(r.total_cost)}</div>
                      <div className="text-xs text-text-secondary">{r.shares.toFixed(4)} acc</div>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{r.reasoning}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Sell recommendations */}
      {sellRecs && sellRecs.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-loss" /> Vender
            </h2>
          </div>
          <div className="divide-y divide-border">
            {sellRecs.map((r) => (
              <div key={r.ticker} className="px-4 py-3 border-l-2 border-l-loss">
                <div className="flex justify-between items-start">
                  <span className="font-semibold">{r.ticker}</span>
                  <span className="text-xs text-text-secondary">{r.shares_to_sell} acc</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">{r.reason}</p>
                <div className="flex gap-3 mt-1 text-xs">
                  <span className="text-text-secondary">
                    G/P: <span className={r.gain_loss >= 0 ? 'text-gain' : 'text-loss'}>
                      {formatCurrency(r.gain_loss)}
                    </span>
                  </span>
                  <span className="text-text-secondary">
                    Impuesto: {formatCurrency(r.tax_long_term)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
