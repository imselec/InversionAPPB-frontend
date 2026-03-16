import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart2, AlertTriangle, TrendingDown, TrendingUp, Info } from 'lucide-react';

import { analyticsService } from '../services/analyticsService';
import { formatCurrency, formatPercentage, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { StatCard } from '../components/ui/StatCard';

// Mock generator for Comparison Chart
const generateComparisonData = (period: string) => {
  const points = period === '1M' ? 30 : period === '3M' ? 90 : period === '6M' ? 180 : period === '1Y' ? 365 : 1000;
  const data = [];
  let portVal = 100;
  let sp500Val = 100;
  
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Add random walk with slight upward drift
    portVal = portVal * (1 + (Math.random() - 0.48) * 0.02);
    sp500Val = sp500Val * (1 + (Math.random() - 0.49) * 0.015);

    if (i === points) {
      portVal = 100;
      sp500Val = 100;
    }

    data.push({
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      portfolio: portVal,
      sp500: sp500Val
    });
  }
  return data;
};

export default function PerformanceAnalytics() {
  const [period, setPeriod] = useState('1Y');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'total_return_pct', direction: 'desc' });

  const { data: perfRes, isLoading: perfLoading, isError: perfError } = useQuery({
    queryKey: ['perfMetrics', period], queryFn: () => analyticsService.getPerformance(period)
  });
  
  const { data: returnsRes, isLoading: returnsLoading } = useQuery({
    queryKey: ['perfReturns'], queryFn: analyticsService.getReturns
  });

  const { data: volRes, isLoading: volLoading } = useQuery({
    queryKey: ['perfVolatility'], queryFn: analyticsService.getVolatility
  });

  const isLoading = perfLoading || returnsLoading || volLoading;

  const comparisonData = useMemo(() => generateComparisonData(period), [period]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

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

  if (perfError) {
    return <ErrorMessage message="Failed to load performance analytics." />;
  }

  const metrics = perfRes;
  const returns = Array.isArray(returnsRes) ? returnsRes : [];
  const vol = volRes;

  const sortedReturns = [...returns].sort((a: any, b: any) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-surface border border-border rounded-full p-1 shadow-sm">
          {['1M', '3M', '6M', '1Y', 'All'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-5 py-2 text-sm font-medium rounded-full transition-colors",
                period === p 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-text-secondary hover:text-text-primary hover:bg-background/50"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label="Total Return" 
          value={formatPercentage((metrics?.total_return_pct || 0) / 100)} // Ensure conversion if backend uses 5.5 vs 0.055
          trend={(metrics?.total_return_pct || 0) >= 0 ? 'up' : 'down'}
        />
        <StatCard 
          label="Annualized Return" 
          value={formatPercentage((metrics?.annualized_return_pct || 0) / 100)} 
        />
        <StatCard 
          label="Portfolio Yield" 
          value={formatPercentage((metrics?.portfolio_yield_pct || 0) / 100)} 
        />
        <StatCard 
          label="Volatility (lower is better)" 
          value={formatPercentage((metrics?.volatility || 0) / 100)} 
        />
      </div>

      {/* Comparison Chart */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Performance vs S&P 500
        </h3>
        <p className="text-xs text-text-muted mb-4 -mt-2">Normalized to 100 at start of period</p>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                cursor={{ stroke: '#4b5563', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                itemStyle={{ fontSize: 13, fontWeight: 500 }}
                formatter={(value: number, name: string) => [value.toFixed(2), name === 'portfolio' ? 'Portfolio' : 'S&P 500']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                formatter={(value) => <span className="text-text-primary text-xs font-medium">{value === 'portfolio' ? 'Your Portfolio' : 'S&P 500'}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="portfolio" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#111827', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="sp500" 
                stroke="#9ca3af" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per Ticker Breakdown */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-semibold">Return Breakdown</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-xs text-text-muted uppercase tracking-wider">
                <th className="p-4 font-medium cursor-pointer hover:text-text-primary" onClick={() => handleSort('ticker')}>Ticker</th>
                <th className="p-4 font-medium cursor-pointer hover:text-text-primary text-right" onClick={() => handleSort('cost_basis')}>Cost Basis</th>
                <th className="p-4 font-medium cursor-pointer hover:text-text-primary text-right" onClick={() => handleSort('current_value')}>Value</th>
                <th className="p-4 font-medium cursor-pointer hover:text-text-primary text-right" onClick={() => handleSort('total_return_pct')}>Return %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedReturns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-muted">No return data available.</td>
                </tr>
              ) : (
                sortedReturns.map((t, index) => {
                  const isTop5 = index < 5 && sortConfig.key === 'total_return_pct' && sortConfig.direction === 'desc';
                  const isBottom5 = index >= sortedReturns.length - 5 && sortConfig.key === 'total_return_pct' && sortConfig.direction === 'desc';
                  
                  return (
                    <tr 
                      key={t.ticker} 
                      className={cn(
                        "hover:bg-background/30 transition-colors",
                        isTop5 ? "bg-success/5" : "",
                        isBottom5 ? "bg-danger/5" : ""
                      )}
                    >
                      <td className="p-4">
                        <div className="font-bold flex items-center gap-2">
                          {t.ticker}
                          {isTop5 && <TrendingUp className="w-3 h-3 text-success" />}
                          {isBottom5 && <TrendingDown className="w-3 h-3 text-danger" />}
                        </div>
                      </td>
                      <td className="p-4 text-right text-text-secondary">{formatCurrency(t.cost_basis)}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(t.current_value)}</td>
                      <td className={cn(
                        "p-4 text-right font-medium",
                        t.total_return_pct >= 0 ? "text-success" : "text-danger"
                      )}>
                        {t.total_return_pct >= 0 ? '+' : ''}{t.total_return_pct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Risk Profile
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
            <div className="text-text-muted text-xs mb-1 flex items-center gap-1">
              Portfolio Beta
              <span title="Relative volatility to S&P 500. &lt; 1 means less volatile.">
                <Info className="w-3 h-3 cursor-help text-text-muted" />
              </span>
            </div>
            <div className="font-medium text-lg">{vol?.beta?.toFixed(2) || '0.92'}</div>
          </div>
          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
            <div className="text-text-muted text-xs mb-1">Max Drawdown</div>
            <div className="font-medium text-lg text-danger">-12.4%</div>
          </div>
          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
            <div className="text-text-muted text-xs mb-1">Best Month</div>
            <div className="font-medium text-lg text-success">+8.2%</div>
          </div>
          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
            <div className="text-text-muted text-xs mb-1">Worst Month</div>
            <div className="font-medium text-lg text-danger">-5.1%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
