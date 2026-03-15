import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertService, type Alert } from '@/services/alertService'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate } from '@/utils/format'
import { Bell, BellOff, Trash2 } from 'lucide-react'

export function AlertConfiguration() {
  const qc = useQueryClient()

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertService.getAlerts,
  })

  const { data: history } = useQuery({
    queryKey: ['alerts-history'],
    queryFn: () => alertService.getHistory(20),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => alertService.toggleAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => alertService.deleteAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  if (isLoading) return <div className="flex justify-center h-40 items-center"><Spinner size="lg" /></div>
  if (error) return <ErrorMessage message="No se pudieron cargar las alertas." />

  return (
    <div className="space-y-4">
      {/* Alerts list */}
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Alertas configuradas ({alerts?.length ?? 0})</h2>
        </div>
        {!alerts || alerts.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">Sin alertas configuradas</p>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((a: Alert) => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.ticker ?? a.alert_type}</span>
                    <span className={`badge-${a.enabled ? 'gain' : 'loss'}`}>
                      {a.enabled ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary capitalize">{a.alert_type}</div>
                  {a.target_price && (
                    <div className="text-xs text-text-secondary">Objetivo: ${a.target_price}</div>
                  )}
                </div>
                <button
                  onClick={() => toggleMutation.mutate(a.id)}
                  className="btn-ghost p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={a.enabled ? 'Desactivar alerta' : 'Activar alerta'}
                >
                  {a.enabled ? <Bell className="h-4 w-4 text-gain" /> : <BellOff className="h-4 w-4 text-text-disabled" />}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(a.id)}
                  className="btn-ghost p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Eliminar alerta"
                >
                  <Trash2 className="h-4 w-4 text-loss" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification history */}
      {history && history.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Historial de notificaciones</h2>
          </div>
          <div className="divide-y divide-border">
            {history.map((n) => (
              <div key={n.id} className="px-4 py-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold">{n.ticker ?? n.alert_type}</span>
                  <span className="text-xs text-text-disabled">{formatDate(n.sent_at)}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
