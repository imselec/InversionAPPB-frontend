import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { watchlistService } from '@/services/watchlistService'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatCurrency } from '@/utils/format'
import { Plus, Trash2, Star } from 'lucide-react'

export function Watchlist() {
  const qc = useQueryClient()
  const [newTicker, setNewTicker] = useState('')
  const [addError, setAddError] = useState('')

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistService.getWatchlist,
  })

  const addMutation = useMutation({
    mutationFn: (ticker: string) => watchlistService.addTicker(ticker.toUpperCase()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
      setNewTicker('')
      setAddError('')
    },
    onError: (err: Error) => setAddError(err.message),
  })

  const removeMutation = useMutation({
    mutationFn: (ticker: string) => watchlistService.removeTicker(ticker),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  if (isLoading) return <div className="flex justify-center h-40 items-center"><Spinner size="lg" /></div>
  if (error) return <ErrorMessage message="No se pudo cargar la watchlist." />

  return (
    <div className="space-y-4">
      {/* Add ticker */}
      <div className="card flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-text-secondary block mb-1">Añadir ticker</label>
          <input
            type="text"
            placeholder="Ej: MSFT"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && newTicker && addMutation.mutate(newTicker)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary
                       font-mono w-full focus:outline-none focus:border-accent uppercase"
            maxLength={10}
          />
        </div>
        <button
          onClick={() => newTicker && addMutation.mutate(newTicker)}
          disabled={addMutation.isPending || !newTicker}
          className="btn-primary flex items-center gap-1"
        >
          {addMutation.isPending ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
          Añadir
        </button>
      </div>
      {addError && <ErrorMessage message={addError} />}

      {/* Watchlist items */}
      {!items || items.length === 0 ? (
        <div className="card text-center py-8 text-text-secondary text-sm">
          Tu watchlist está vacía. Añade tickers para seguirlos.
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center">
            <h2 className="text-sm font-semibold">Watchlist ({items.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.ticker} className="px-4 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.ticker}</span>
                    {item.meets_criteria && (
                      <Star className="h-3 w-3 text-warning fill-warning" aria-label="Cumple criterios" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{formatCurrency(item.current_price)}</span>
                    <button
                      onClick={() => removeMutation.mutate(item.ticker)}
                      className="btn-ghost p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Eliminar ${item.ticker} de watchlist`}
                    >
                      <Trash2 className="h-4 w-4 text-loss" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-text-secondary">
                  <span>Yield: <span className="text-gain">{(item.dividend_yield * 100).toFixed(2)}%</span></span>
                  <span>P/E: <span className="text-text-primary">{item.pe_ratio.toFixed(1)}</span></span>
                  <span>Score: <span className="text-accent">{item.score.toFixed(0)}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
