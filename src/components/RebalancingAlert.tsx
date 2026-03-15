import { useQuery } from '@tanstack/react-query'
import apiClient from '@/services/apiClient'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { cn } from '@/utils/cn'

interface BalanceStatus {
  allocations: Array<{
    ticker: string
    current_allocation: number
    target_allocation: number
    deviation: number
    alert_type: 'OVERWEIGHT' | 'UNDERWEIGHT' | 'OK'
  }>
  is_balanced: boolean
}

export function RebalancingAlert() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rebalancing-status'],
    queryFn: () => apiClient.get<BalanceStatus>('/rebalancing/status'),
  })

  if (isLoading) return <div className="flex justify-center h-40 items-center"><Spinner size="lg" /></div>
  if (error || !data) return <ErrorMessage message="No se pudo cargar el estado de balance." />

  const overweight = data.allocations.filter((a) => a.alert_type === 'OVERWEIGHT')
  const underweight = data.allocations.filter((a) => a.alert_type === 'UNDERWEIGHT')
  const ok = data.allocations.filter((a) => a.alert_type === 'OK')

  return (
    <div className="space-y-4">
      {/* Summary badge */}
      <div className={cn('card flex items-center gap-3', data.is_balanced ? 'border-gain/40' : 'border-warning/40')}>
        <span className={`h-3 w-3 rounded-full ${data.is_balanced ? 'bg-gain' : 'bg-warning'}`} />
        <span className="text-sm font-medium">
          {data.is_balanced ? 'Portfolio balanceado' : `${overweight.length + underweight.length} posición(es) fuera de rango`}
        </span>
      </div>

      {/* Overweight */}
      {overweight.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-warning">Sobreponderad. (&gt;20%)</h2>
          </div>
          {overweight.map((a) => <AllocationRow key={a.ticker} item={a} />)}
        </div>
      )}

      {/* Underweight */}
      {underweight.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-loss">Infraponderad. (&lt;10%)</h2>
          </div>
          {underweight.map((a) => <AllocationRow key={a.ticker} item={a} />)}
        </div>
      )}

      {/* OK positions */}
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-secondary">En rango ({ok.length})</h2>
        </div>
        {ok.map((a) => <AllocationRow key={a.ticker} item={a} />)}
      </div>
    </div>
  )
}

function AllocationRow({ item }: { item: BalanceStatus['allocations'][0] }) {
  const deviationColor =
    item.alert_type === 'OVERWEIGHT' ? 'text-warning' :
    item.alert_type === 'UNDERWEIGHT' ? 'text-loss' : 'text-gain'

  return (
    <div className="px-4 py-3 flex justify-between items-center border-b border-border last:border-0">
      <span className="font-semibold text-sm">{item.ticker}</span>
      <div className="text-right text-xs font-mono">
        <div className="text-text-primary">{item.current_allocation.toFixed(1)}%</div>
        <div className={deviationColor}>
          {item.deviation >= 0 ? '+' : ''}{item.deviation.toFixed(1)}% vs {item.target_allocation.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}
