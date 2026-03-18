import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, RefreshCw, AlertCircle, ShieldCheck, Check } from 'lucide-react';

import { settingsService } from '../services/settingsService';
import { formatCurrency, cn } from '../utils/utils';
import { PageLoader } from '../components/ui/PageLoader';

const HOLDINGS = [
  'AVGO', 'PG', 'NEE', 'JNJ', 'UPS', 'TXN', 'CVX', 'XOM', 'ABBV', 
  'LMT', 'O', 'JPM', 'DUK', 'KO', 'PEP', 'BLK', 'LLY', 'RTX', 'CAT'
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState('');
  
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('5');
  
  const [isCustomAllocation, setIsCustomAllocation] = useState(false);
  const [overweightThreshold, setOverweightThreshold] = useState(20);
  const [underweightThreshold, setUnderweightThreshold] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: budgetRes, isLoading: budgetLoading } = useQuery({
    queryKey: ['settingsBudget'], queryFn: settingsService.getBudget, retry: 1,
  });

  const { mutate: updateBudget, isPending: budgetUpdating } = useMutation({
    mutationFn: (val: number) => settingsService.updateBudget(val),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settingsBudget'] });
      setIsEditingBudget(false);
      showToast('Budget updated successfully');
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveBudget = () => {
    const val = Number(budgetInput);
    if (isNaN(val) || val < 50) {
      setBudgetError('Budget must be at least $50');
      return;
    }
    setBudgetError('');
    updateBudget(val);
  };

  const isLoading = budgetLoading;

  if (isLoading) {
    return <PageLoader message="Cargando configuración..." />;
  }

  const currentBudget = budgetRes?.monthly_budget || 300;

  return (
    <div className="space-y-6 pb-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-success text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Investment Settings */}
      <section className="card">
        <h2 className="text-lg font-bold mb-4 border-b border-border pb-2">Investment Settings</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-medium">Monthly Budget</div>
              <div className="text-sm text-text-muted mt-0.5">Used for buy recommendations</div>
            </div>
            
            {isEditingBudget ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => {
                      setBudgetInput(e.target.value);
                      if (budgetError) setBudgetError('');
                    }}
                    className={cn(
                      "bg-background border rounded-lg pl-8 pr-4 py-2 w-32 focus:outline-none focus:border-primary",
                      budgetError ? "border-danger" : "border-border"
                    )}
                    placeholder="Min $50"
                  />
                </div>
                <button 
                  onClick={handleSaveBudget}
                  disabled={budgetUpdating}
                  className="btn-primary py-2 px-3 min-h-0"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setIsEditingBudget(false);
                    setBudgetError('');
                  }}
                  className="p-2 text-text-secondary hover:bg-surface rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-2xl font-mono font-bold">{formatCurrency(currentBudget)}</div>
                <button 
                  onClick={() => {
                    setBudgetInput(currentBudget.toString());
                    setIsEditingBudget(true);
                  }}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          {budgetError && <div className="text-danger text-xs text-right">{budgetError}</div>}

          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <div>
              <div className="font-medium">Auto-refresh Prices</div>
              <div className="text-sm text-text-muted mt-0.5">When market is open</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
              />
              <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
            </label>
          </div>

          {autoRefresh && (
            <div className="flex items-center justify-between pl-4">
              <div className="text-sm text-text-secondary">Refresh Interval</div>
              <select 
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Target Allocations */}
      <section className="card">
        <h2 className="text-lg font-bold mb-4 border-b border-border pb-2">Allocation Targets</h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Target Strategy</div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-background p-1 rounded-lg border border-border">
              <button
                className={cn(
                  "py-2 px-4 text-sm font-medium rounded-md transition-colors",
                  !isCustomAllocation ? "bg-surface text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
                onClick={() => setIsCustomAllocation(false)}
              >
                Equal Weight
              </button>
              <button
                className={cn(
                  "py-2 px-4 text-sm font-medium rounded-md transition-colors",
                  isCustomAllocation ? "bg-surface text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
                onClick={() => setIsCustomAllocation(true)}
              >
                Custom Targets
              </button>
            </div>
          </div>

          {!isCustomAllocation ? (
            <div className="bg-background/80 p-4 rounded-lg flex items-center justify-between border border-border">
              <div>
                <div className="text-sm font-medium mb-1">Equal Weight Applied</div>
                <div className="text-xs text-text-secondary">All {HOLDINGS.length} stocks target 5.56% of portfolio</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1/18
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm text-text-secondary mb-4 flex items-center justify-between">
                <span>Set custom percentages for each holding.</span>
                <span className="font-bold text-danger">Sum: 100%</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
                {HOLDINGS.map(ticker => (
                  <div key={ticker} className="flex items-center justify-between bg-background border border-border rounded py-1 px-2">
                    <span className="text-sm font-bold">{ticker}</span>
                    <div className="flex items-center opacity-50 cursor-not-allowed">
                      <input type="number" disabled value={5.56} className="w-12 bg-transparent text-right text-sm outline-none" />
                      <span className="text-xs ml-0.5">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button disabled className="mt-4 w-full btn-primary opacity-50 cursor-not-allowed">
                Save Custom Targets
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Thresholds */}
      <section className="card">
        <h2 className="text-lg font-bold mb-4 border-b border-border pb-2">Rebalancing Thresholds</h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Overweight Alert Threshold</label>
              <span className="text-sm font-bold text-danger">+{overweightThreshold}%</span>
            </div>
            <input 
              type="range" 
              min="10" max="30" step="1" 
              value={overweightThreshold}
              onChange={(e) => setOverweightThreshold(Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-danger" 
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>10%</span>
              <span>Alert when position exceeds target by {overweightThreshold}%</span>
              <span>30%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Underweight Alert Threshold</label>
              <span className="text-sm font-bold text-primary">-{underweightThreshold}%</span>
            </div>
            <input 
              type="range" 
              min="5" max="15" step="1" 
              value={underweightThreshold}
              onChange={(e) => setUnderweightThreshold(Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary" 
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>5%</span>
              <span>Alert when position falls below target by {underweightThreshold}%</span>
              <span>15%</span>
            </div>
          </div>
          
          <button onClick={() => showToast('Thresholds saved')} className="w-full btn-primary flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Save Thresholds
          </button>
        </div>
      </section>

      {/* Compliance Notice */}
      <section className="card bg-warning/5 border-warning/20">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-warning">
          <AlertCircle className="w-4 h-4" />
          Regulatory & Compliance
        </h2>
        <ul className="text-xs text-text-secondary space-y-2 list-disc pl-4">
          <li>This app is for personal use only and does not constitute financial advice.</li>
          <li>PRIIP regulations apply to complex investment products in the EU/Spain.</li>
          <li>ETF investments may have restrictions for Spain-based investors.</li>
          <li>Consult a tax advisor for Spanish tax reporting requirements.</li>
        </ul>
      </section>

      {/* About */}
      <section className="card text-center py-6">
        <ShieldCheck className="w-12 h-12 mx-auto text-primary opacity-50 mb-3" />
        <h2 className="text-lg font-bold mb-1">Investment Advisor</h2>
        <div className="text-sm text-text-muted mb-6">Version 1.0.0</div>
        
        <div className="inline-flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-xs font-mono text-text-secondary mb-4">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          https://inversionappb-backend.onrender.com
        </div>
        
        <button className="flex mx-auto items-center gap-2 text-sm text-primary hover:underline font-medium">
          <RefreshCw className="w-4 h-4" />
          Test API Connection
        </button>
      </section>
    </div>
  );
}
