import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { Bell, BellRing, BellOff, Plus, Trash2, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

import { alertService } from '../services/alertService';
import { formatCurrency, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Badge } from '../components/ui/Badge';

const HOLDINGS = [
  'AVGO', 'PG', 'NEE', 'JNJ', 'UPS', 'TXN', 'CVX', 'XOM', 'ABBV', 
  'LMT', 'O', 'JPM', 'DUK', 'KO', 'PEP', 'BLK', 'LLY', 'RTX', 'CAT'
];

export default function Alerts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  
  // New alert form state
  const [alertType, setAlertType] = useState<'price' | 'dividend' | 'rebalancing' | 'monthly_investment'>('price');
  const [alertTicker, setAlertTicker] = useState('AVGO');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const { data: alertsRes, isLoading: alertsLoading, isError: alertsError } = useQuery({
    queryKey: ['alertsList'], queryFn: alertService.getAlerts
  });

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['alertsHistory'], queryFn: () => alertService.getHistory(50)
  });

  const { mutate: toggleAlert } = useMutation({
    mutationFn: (id: number) => alertService.toggleAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertsList'] })
  });
  
  const { mutate: deleteAlert } = useMutation({
    mutationFn: (id: number) => alertService.deleteAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertsList'] })
  });

  const { mutate: createAlert, isPending: isCreating } = useMutation({
    mutationFn: (data: any) => alertService.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertsList'] });
      setIsAddingAlert(false);
      setTargetPrice('');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert({
      alert_type: alertType,
      ticker: ['price', 'dividend'].includes(alertType) ? alertTicker : null,
      target_price: alertType === 'price' ? Number(targetPrice) : null,
      enabled: true,
      condition: condition // assuming backend handles this depending on implementation detail
    } as any);
  };

  const isLoading = alertsLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-16 w-full" />
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-32 w-full" />
      </div>
    );
  }

  if (alertsError) {
    return <ErrorMessage message="Failed to load alerts data." />;
  }

  const alerts = alertsRes || [];
  const history = historyRes || [];
  const unreadCount = history.filter(h => !h.read).length;

  return (
    <div className="space-y-6">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="card !p-0 overflow-hidden">
        <Tabs.List className="flex border-b border-border bg-surface">
          <Tabs.Trigger 
            value="active" 
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex justify-center items-center gap-2",
              activeTab === 'active' ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/50"
            )}
          >
            Active Alerts <Badge variant="primary" className="ml-1 px-1.5 py-0 h-4 text-[10px]">{alerts.filter(a => a.enabled).length}</Badge>
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="history" 
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex justify-center items-center gap-2",
              activeTab === 'history' ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/50"
            )}
          >
            History {unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-danger"></span>}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="active" className="p-0 outline-none">
          <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
            <h3 className="text-base font-semibold">Configured Alerts</h3>
            <button 
              onClick={() => setIsAddingAlert(!isAddingAlert)}
              className="btn-primary py-1.5 px-3 min-h-0 text-sm flex items-center gap-1"
            >
              {isAddingAlert ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Alert</>}
            </button>
          </div>

          {isAddingAlert && (
            <div className="p-4 bg-background border-b border-border animate-in fade-in slide-in-from-top-4">
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Alert Type</label>
                  <select 
                    value={alertType}
                    onChange={(e: any) => setAlertType(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="price">Price Target</option>
                    <option value="dividend">Dividend Upcoming</option>
                    <option value="rebalancing">Rebalancing Needed</option>
                    <option value="monthly_investment">Monthly Investment Reminder</option>
                  </select>
                </div>

                {['price', 'dividend'].includes(alertType) && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Ticker</label>
                    <select 
                      value={alertTicker}
                      onChange={(e) => setAlertTicker(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    >
                      {HOLDINGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                {alertType === 'price' && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text-secondary mb-1">Condition</label>
                      <select 
                        value={condition}
                        onChange={(e: any) => setCondition(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="above">Crosses Above</option>
                        <option value="below">Drops Below</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text-secondary mb-1">Target Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                        <input
                          type="number"
                          required
                          min={1}
                          step="0.01"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full btn-primary py-2 flex items-center justify-center gap-2"
                >
                  {isCreating ? 'Saving...' : 'Save Alert'}
                </button>
              </form>
            </div>
          )}

          <div className="divide-y divide-border">
            {alerts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <BellOff className="w-12 h-12 text-text-muted mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No active alerts</h3>
                <p className="text-sm text-text-secondary max-w-xs">Create an alert to stay informed about price movements or portfolio balance.</p>
              </div>
            ) : (
              alerts.map(alert => {
                let icon = <Bell className="w-5 h-5" />;
                let description = '';
                
                if (alert.alert_type === 'price') {
                  icon = <TrendingUp className="w-5 h-5 text-primary" />;
                  description = `${alert.ticker} price crosses ${formatCurrency(alert.target_price || 0)}`;
                } else if (alert.alert_type === 'dividend') {
                  icon = <Calendar className="w-5 h-5 text-warning" />;
                  description = `Upcoming dividend payment for ${alert.ticker}`;
                } else if (alert.alert_type === 'rebalancing') {
                  icon = <AlertCircle className="w-5 h-5 text-danger" />;
                  description = `Portfolio allocation deviates from target thresholds`;
                } else if (alert.alert_type === 'monthly_investment') {
                  icon = <BellRing className="w-5 h-5 text-success" />;
                  description = `Monthly investment reminder`;
                }

                return (
                  <div key={alert.id} className={cn("p-4 flex items-center justify-between transition-colors", alert.enabled ? "hover:bg-background/50" : "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", alert.enabled ? "bg-surface border-border" : "bg-transparent border-dashed border-border text-text-muted")}>
                        {icon}
                      </div>
                      <div>
                        <div className="font-bold capitalize">{alert.alert_type.replace('_', ' ')} Alert</div>
                        <div className="text-sm text-text-secondary">{description}</div>
                        {alert.last_triggered && (
                          <div className="text-xs text-text-muted mt-1">
                            Last triggered: {new Date(alert.last_triggered).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={alert.enabled}
                          onChange={() => toggleAlert(alert.id)}
                        />
                        <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                      </label>
                      <button 
                        onClick={() => deleteAlert(alert.id)}
                        className="text-text-muted hover:text-danger p-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content value="history" className="p-0 outline-none divide-y divide-border">
          <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
            <h3 className="text-base font-semibold">Notification History</h3>
            {history.length > 0 && (
               <button className="text-xs text-primary font-medium hover:underline">Mark all as read</button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No notification history found.</div>
          ) : (
            history.map(item => (
              <div key={item.id} className={cn("p-4 transition-colors", !item.read ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-background/30")}>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.sent_at).toLocaleString()}
                  </div>
                  {!item.read && <Badge variant="primary" className="text-[9px] px-1 py-0 h-4">NEW</Badge>}
                </div>
                <div className={cn("text-sm", !item.read ? "font-medium text-text-primary" : "text-text-secondary")}>
                  {item.message}
                </div>
              </div>
            ))
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
