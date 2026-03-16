import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Filter, Layers } from 'lucide-react';

import { portfolioService, Transaction } from '../services/portfolioService';
import { formatCurrency, formatPercentage, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';

// Mock chart data generator for portfolio growth
const generateMockChartData = (period: string, currentValue: number) => {
  const points = period === '1M' ? 30 : period === '3M' ? 90 : period === '6M' ? 180 : period === '1Y' ? 365 : 1000;
  const data = [];
  let val = currentValue * 0.7; // Start 30% lower
  
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Add some random walk
    val = val * (1 + (Math.random() - 0.45) * 0.02);
    // Force end value to be close to currentValue
    if (i === 0) val = currentValue;

    data.push({
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: period === 'All' ? '2-digit' : undefined }),
      fullDate: d.getTime(),
      value: val
    });
  }
  return data;
};

export default function InvestmentHistory() {
  const [period, setPeriod] = useState('1Y');
  
  const { data: dashRes, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: ['portfolioDashboard'], queryFn: portfolioService.getDashboard
  });

  const { data: histRes } = useQuery({
    queryKey: ['portfolioHistory'], queryFn: () => portfolioService.getHistory()
  });

  const isLoading = dashLoading; // Only block on primary query

  const dashboard = dashRes;
  const history = Array.isArray(histRes) ? histRes : [];
  
  const chartData = useMemo(() => {
    if (!dashboard) return [];
    return generateMockChartData(period, dashboard.total_value);
  }, [dashboard, period]);

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

  if (dashError) {
    return <ErrorMessage message="Failed to load history data." />;
  }

  const currentVal = dashboard?.total_value || 0;
  const costBasis = dashboard?.total_invested || 0;
  const totalReturnPct = dashboard?.total_gain_loss_pct || 0;

  // Process history by month
  const sortedHistory = [...history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const groupedHistory: Record<string, Transaction[]> = {};
  
  sortedHistory.forEach(tx => {
    const d = new Date(tx.date);
    const monthYear = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (!groupedHistory[monthYear]) groupedHistory[monthYear] = [];
    groupedHistory[monthYear].push(tx);
  });

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Invested" value={formatCurrency(costBasis)} />
        <StatCard label="Current Value" value={formatCurrency(currentVal)} />
        <StatCard 
          label="Total Return" 
          value={formatPercentage(totalReturnPct)}
          trend={totalReturnPct >= 0 ? 'up' : 'down'}
        />
        <StatCard label="Total Transactions" value={history.length} />
      </div>

      {/* Chart Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Portfolio Growth
          </h3>
          <div className="flex bg-background border border-border rounded-lg p-1">
            {['1M', '3M', '6M', '1Y', 'All'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  period === p ? "bg-surface text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), 'Value']}
                labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#111827', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters (Mock) */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-base font-semibold">Transaction History</h3>
        <button className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-6">
        {Object.keys(groupedHistory).length === 0 ? (
          <div className="card p-8 text-center text-text-muted">No transactions found.</div>
        ) : (
          Object.entries(groupedHistory).map(([monthYear, txs]) => (
            <div key={monthYear} className="card !p-0 overflow-hidden">
              <div className="bg-background/50 px-4 py-2 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider flex justify-between">
                <span>{monthYear}</span>
                <span>{txs.length} transaction{txs.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="divide-y divide-border">
                {txs.map(tx => {
                  const isBuy = tx.action === 'BUY';
                  const isSell = tx.action === 'SELL';
                  // Assuming REINVESTMENT might come from transaction_type
                  const isReinvestment = tx.transaction_type?.toLowerCase().includes('reinvest');
                  
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-background/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-xs text-text-muted w-16 text-right">
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge 
                            variant={isReinvestment ? 'warning' : isBuy ? 'success' : 'danger'}
                            className="text-[10px] px-1.5 py-0 uppercase"
                          >
                            {isReinvestment ? 'Reinvest' : tx.action}
                          </Badge>
                          <div className="font-bold">{tx.ticker}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {isSell ? '-' : '+'}{tx.shares} <span className="text-text-muted font-normal text-xs">shs @</span> {formatCurrency(tx.price)}
                        </div>
                        <div className="font-mono font-bold mt-1">
                          {formatCurrency(tx.total_amount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
