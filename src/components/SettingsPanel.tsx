import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '@/services/settingsService'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export function SettingsPanel() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['budget'],
    queryFn: settingsService.getBudget,
  })

  const [budget, setBudget] = useState<number | ''>('')
  const [saved, setSaved] = useState(false)
  const [validationError, setValidationError] = useState('')

  const mutation = useMutation({
    mutationFn: (b: number) => settingsService.updateBudget(b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleSave = () => {
    const val = Number(budget)
    if (val < 50) {
      setValidationError('El presupuesto mínimo es $50.')
      return
    }
    setValidationError('')
    mutation.mutate(val)
  }

  if (isLoading) return <div className="flex justify-center h-40 items-center"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      {/* Budget */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold">Presupuesto mensual</h2>
        <p className="text-xs text-text-secondary">
          Actual: <span className="font-mono text-text-primary">${data?.monthly_budget ?? 300}</span>
        </p>
        <input
          type="number"
          min={50}
          step={50}
          placeholder="Nuevo presupuesto"
          value={budget}
          onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
          className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary
                     font-mono w-full focus:outline-none focus:border-accent"
        />
        {validationError && <ErrorMessage message={validationError} />}
        <button
          onClick={handleSave}
          disabled={mutation.isPending || budget === ''}
          className="btn-primary w-full"
        >
          {mutation.isPending ? <Spinner size="sm" /> : saved ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>

      {/* Compliance notices */}
      <div className="card space-y-2">
        <h2 className="text-sm font-semibold">Avisos regulatorios</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Esta aplicación es para uso personal. Las recomendaciones no constituyen asesoramiento
          financiero regulado. Los ETFs pueden estar sujetos a restricciones PRIIP en la UE.
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          Las ganancias de capital en acciones USA están sujetas a retención en origen (30% o
          reducido por tratado España-USA al 15%). Consulta con un asesor fiscal.
        </p>
      </div>

      {/* Backend URL */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-2">Backend</h2>
        <p className="text-xs font-mono text-text-secondary break-all">
          https://inversionappb-backend.onrender.com
        </p>
      </div>
    </div>
  )
}
