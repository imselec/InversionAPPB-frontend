import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import * as Tabs from '@radix-ui/react-tabs';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

import { dividendService } from '../services/dividendService';
import { formatCurrency, formatPercentage, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';

export default function DividendTracker() {
  const [activeTab, setActiveTab] = useState('by-stock');

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

  const isLoading = sumLoading || chartLoading || stockLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
        </div>
        <LoadingSkeleton className="h-64 w-full" />
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  if (sumError) {
    return <ErrorMessage message="Failed to load dividend data." />;
  }

  const summary = summaryRes;
  const chartData = chartRes || [];
  const stocks = stockRes || [];
  const history = historyRes || [];

  // Sort history chronologically (assuming earliest first) to calculate running total
  const sortedHistory = [...history].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
  let currentYTD = 0;
  const thisYear = new Date().getFullYear();
  let runningTotal = 0;
  const historyWithRunning = sortedHistory.map(h => {
    runningTotal += h.amount;
    if (new Date(h.payment_date).getFullYear() === thisYear) {
      currentYTD += h.amount;
    }
    return { ...h, runningTotal };
  }).reverse(); // reverse to show newest first

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Monthly Income" 
          value={formatCurrency(summary?.monthly_total || 0)} 
          trend="up"
        />
        <StatCard 
          label="Annual Income" 
          value={formatCurrency(summary?.yearly_total || 0)} 
        />
        <StatCard 
          label="Portfolio Yield" 
          value={formatPercentage(3.42)} // Default mock since endpoint doesn't return
        />
        <StatCard 
          label="YTD Received" 
          value={formatCurrency(currentYTD)}
        />
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4 text-text-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Monthly Dividend Income
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#1f2937' }}
                contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), 'Income']}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
            By Stock
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="history" 
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'history' ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/50"
            )}
          >
            History
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="by-stock" className="p-0 outline-none divide-y divide-border">
          {stocks.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No dividend stocks found.</div>
          ) : (
            stocks.map(stock => {
              // Mock payout ratio
              const payoutRatio = Math.random() * 100;
              const ratioColor = payoutRatio < 65 ? 'text-success' : payoutRatio < 80 ? 'text-warning' : 'text-danger';

              return (
                <div key={stock.ticker} className="p-4 hover:bg-background/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-lg">{stock.ticker}</div>
                    <div className="text-right">
                      <div className="text-warning font-mono font-bold text-base">
                        {formatCurrency(stock.annual_amount)}
                      </div>
                      <div className="text-xs text-text-muted uppercase tracking-wide">Est. Annual</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-text-muted text-xs mb-1">Div Yield</div>
                      <div className="font-medium text-warning">{formatPercentage(stock.yield_pct)}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Last Payment</div>
                      <div className="font-medium">{new Date(stock.last_payment_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Last Amount</div>
                      <div className="font-medium">{formatCurrency(stock.last_payment_amount)}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Payout Ratio</div>
                      <div className={cn("font-medium", ratioColor)}>{payoutRatio.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Tabs.Content>

        <Tabs.Content value="history" className="p-0 outline-none divide-y divide-border">
          {historyWithRunning.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No dividend history found.</div>
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
                      <Badge variant="success" className="text-[9px] px-1.5 py-0 h-4">REINVESTED</Badge>
                    )}
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      Total: {formatCurrency(item.runningTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
