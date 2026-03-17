import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, DollarSign, TrendingUp, Download, Plus, X } from 'lucide-react';

import { dividendService, ManualDividendRequest } from '../services/dividendService';
import { formatCurrency, formatPercentage, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';

const PORTFOLIO_TICKERS = [
  'AVGO','PG','NEE','JNJ','UPS','TXN','CVX','XOM',
  'ABBV','LMT','O','JPM','DUK','KO','PEP','BLK','LLY','RTX','CAT'
];

export default function DividendTracker() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('by-stock');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [form, setForm] = useState<ManualDividendRequest>({
    ticker: 'AVGO',
    payment_date: new Date().toISOString().slice(0, 10),
    per_share_amount: 0,
    reinvested: true,
  });

  const { data: summaryRes, isLoading: sumLoading, isError: sumError } = useQuery({
    queryKey: ['divSummary'], queryFn: dividendService.getSummary
  });
  const { data: chartRes, isLoading: chartLoading } = useQuery({
    queryKey: ['divChart'], queryFn: dividendService.getChart
  });
  const { data: stockRes, isLoading: stockLoading } = useQuery({
    queryKey: ['divByStock'], queryFn: dividendService.getByTicker
  });
  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['divHistory'], queryFn: dividendService.getHistory
  });

  const { mutate: importDividends, isPending: isImporting } = useMutation({
    mutationFn: dividendService.importHistorical,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['divSummary'] });
      queryClient.invalidateQueries({ queryKey: ['divChart'] });
      queryClient.invalidateQueries({ queryKey: ['divByStock'] });
      queryClient.invalidateQueries({ queryKey: ['divHistory'] });
      alert(`Importados: ${data.imported} pagos, omitidos: ${data.skipped} duplicados`);
    },
    onError: () => alert('Error al importar dividendos'),
  });

  const { mutate: recordDividend, isPending: isRecording } = useMutation({
    mutationFn: dividendService.recordManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divSummary'] });
      queryClient.invalidateQueries({ queryKey: ['divChart'] });
      queryClient.invalidateQueries({ queryKey: ['divByStock'] });
      queryClient.invalidateQueries({ queryKey: ['divHistory'] });
      setShowRecordModal(false);
    },
    onError: () => alert('Error al registrar dividendo'),
  });

  const isLoading = sumLoading || chartLoading || stockLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} className="h-24 w-full" />)}
        </div>
        <LoadingSkeleton className="h-64 w-full" />
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  if (sumError) return <ErrorMessage message="Failed to load dividend data." />;

  const summary = summaryRes;
  const chartData = Array.isArray(chartRes) ? chartRes : [];
  const stocks = Array.isArray(stockRes) ? stockRes : [];
  const history = Array.isArray(historyRes) ? historyRes : [];

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );
  const thisYear = new Date().getFullYear();
  let currentYTD = 0;
  let runningTotal = 0;
  const historyWithRunning = sortedHistory.map(h => {
    runningTotal += h.amount;
    if (new Date(h.payment_date).getFullYear() === thisYear) currentYTD += h.amount;
    return { ...h, runningTotal };
  }).reverse();

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => importDividends()}
          disabled={isImporting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-background/50 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-primary" />
          {isImporting ? 'Importando...' : 'Importar Historial'}
        </button>
        <button
          onClick={() => setShowRecordModal(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Dividendo
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Ingreso Mensual" value={formatCurrency(summary?.monthly_total || 0)} trend="up" />
        <StatCard label="Ingreso Anual" value={formatCurrency(summary?.yearly_total || 0)} />
        <StatCard label="Total Acumulado" value={formatCurrency(summary?.total_all_time || 0)} />
        <StatCard label="YTD Recibido" value={formatCurrency(currentYTD)} />
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4 text-text-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Dividendos Mensuales
        </h3>
        {chartData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-text-muted text-sm">
            Sin datos. Pulsa "Importar Historial" para cargar dividendos.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#1f2937' }}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Dividendo']}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="card !p-0 overflow-hidden">
        <Tabs.List className="flex border-b border-border bg-surface">
          <Tabs.Trigger
            value="by-stock"
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'by-stock' ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/50"
            )}
          >
            Por Acción
          </Tabs.Trigger>
          <Tabs.Trigger
            value="history"
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'history' ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/50"
            )}
          >
            Historial
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="by-stock" className="p-0 outline-none divide-y divide-border">
          {stocks.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              Sin datos. Pulsa "Importar Historial".
            </div>
          ) : (
            stocks.map(stock => (
              <div key={stock.ticker} className="p-4 hover:bg-background/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">{stock.ticker}</div>
                  <div className="text-right">
                    <div className="text-warning font-mono font-bold text-base">
                      {formatCurrency(stock.annual_amount)}
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-wide">Est. Anual</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <div className="text-text-muted text-xs mb-1">Yield</div>
                    <div className="font-medium text-warning">{formatPercentage(stock.yield_pct)}</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Último Pago</div>
                    <div className="font-medium">
                      {stock.last_payment_date
                        ? new Date(stock.last_payment_date).toLocaleDateString()
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Último Importe</div>
                    <div className="font-medium">{formatCurrency(stock.last_payment_amount)}</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Total Recibido</div>
                    <div className="font-medium text-success">{formatCurrency(stock.total_dividends)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </Tabs.Content>

        <Tabs.Content value="history" className="p-0 outline-none divide-y divide-border">
          {historyWithRunning.length === 0 ? (
            <div className="p-8 text-center text-text-muted">Sin historial de dividendos.</div>
          ) : (
            historyWithRunning.map((item, i) => (
              <div key={item.id || i} className="p-4 flex items-center justify-between hover:bg-background/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-warning/10 flex items-center justify-center text-warning">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">{item.ticker}</div>
                    <div className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.payment_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="font-mono text-warning font-bold">{formatCurrency(item.amount)}</div>
                  <div className="flex items-center gap-2">
                    {item.reinvested && (
                      <Badge variant="success" className="text-[9px] px-1.5 py-0 h-4">REINVERTIDO</Badge>
                    )}
                    <span className="text-xs text-text-muted">
                      Total: {formatCurrency(item.runningTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </Tabs.Content>
      </Tabs.Root>

      {/* Record Dividend Modal */}
      <Dialog.Root open={showRecordModal} onOpenChange={setShowRecordModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm bg-surface border border-border rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="font-semibold text-base">Registrar Dividendo</Dialog.Title>
              <button onClick={() => setShowRecordModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Ticker</label>
                <select
                  value={form.ticker}
                  onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                >
                  {PORTFOLIO_TICKERS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1 block">Fecha de pago</label>
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1 block">Dividendo por acción ($)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.per_share_amount || ''}
                  onChange={e => {
                    const val = e.target.value.replace(',', '.');
                    setForm(f => ({ ...f, per_share_amount: parseFloat(val) || 0 }));
                  }}
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reinvested"
                  checked={form.reinvested}
                  onChange={e => setForm(f => ({ ...f, reinvested: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="reinvested" className="text-sm text-text-secondary">
                  Reinvertido automáticamente
                </label>
              </div>
            </div>

            <button
              onClick={() => recordDividend(form)}
              disabled={isRecording || !form.per_share_amount}
              className="w-full mt-4 btn-primary py-2.5 text-sm disabled:opacity-50"
            >
              {isRecording ? 'Guardando...' : 'Guardar'}
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
