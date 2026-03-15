import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { portfolioService, Holding } from '../services/portfolioService';
import { marketService } from '../services/marketService';
import { formatCurrency, formatPercentage, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Badge } from '../components/ui/Badge';

const SECTOR_MAP: Record<string, string> = {
  AVGO: 'Technology', TXN: 'Technology',
  PG: 'Consumer Staples', KO: 'Consumer Staples', PEP: 'Consumer Staples',
  NEE: 'Utilities', DUK: 'Utilities',
  JNJ: 'Healthcare', ABBV: 'Healthcare', LLY: 'Healthcare',
  UPS: 'Industrials', LMT: 'Industrials', RTX: 'Industrials', CAT: 'Industrials',
  CVX: 'Energy', XOM: 'Energy',
  O: 'Real Estate',
  JPM: 'Financials', BLK: 'Financials'
};

const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#3b82f6',
  'Consumer Staples': '#f59e0b',
  'Utilities': '#10b981',
  'Healthcare': '#ef4444',
  'Industrials': '#8b5cf6',
  'Energy': '#f97316',
  'Real Estate': '#06b6d4',
  'Financials': '#eab308'
};

function processSectorData(holdings: Holding[]) {
  const sectors: Record<string, number> = {};
  holdings.forEach(h => {
    const sector = SECTOR_MAP[h.ticker] || 'Other';
    sectors[sector] = (sectors[sector] || 0) + h.market_value;
  });
  return Object.entries(sectors).map(([name, value]) => ({ name, value }));
}

export default function PortfolioDashboard() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: marketResponse, isLoading: marketLoading } = useQuery({
    queryKey: ['marketStatus'],
    queryFn: marketService.getStatus,
    refetchInterval: 60000,
  });

  const isMarketOpen = marketResponse?.is_open;

  const {
    data: dashboardResponse,
    isLoading: dashLoading,
    isError: dashError,
    refetch: refetchDash,
    isRefetching
  } = useQuery({
    queryKey: ['portfolioDashboard'],
    queryFn: portfolioService.getDashboard,
    refetchInterval: isMarketOpen ? 300000 : false, // 5 min auto-refresh if open
  });

  if (dashLoading || marketLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  if (dashError) {
    return <ErrorMessage message="Failed to load portfolio data" onRetry={refetchDash} />;
  }

  const dashboard = dashboardResponse;
  if (!dashboard) return null;

  const sectorData = processSectorData(dashboard.holdings);
  const totalReturnIsPositive = dashboard.total_gain_loss >= 0;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">Total Portfolio Value</h2>
          <div className="flex items-center gap-2">
            {isRefetching && <RefreshCw className="w-4 h-4 text-text-muted animate-spin" />}
            <span className="text-xs text-text-muted">
              Updated {new Date(dashboard.last_updated || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <div className="text-4xl font-bold font-mono tracking-tight text-white mb-2">
          {formatCurrency(dashboard.total_value)}
        </div>
        
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center text-lg font-medium", totalReturnIsPositive ? "text-success" : "text-danger")}>
            {totalReturnIsPositive ? <ArrowUpRight className="w-5 h-5 mr-1" /> : <ArrowDownRight className="w-5 h-5 mr-1" />}
            {formatCurrency(Math.abs(dashboard.total_gain_loss))} ({formatPercentage(dashboard.total_gain_loss_pct)})
          </div>
          <Badge variant={isMarketOpen ? 'success' : 'default'} className="uppercase">
            {isMarketOpen ? 'Market Open' : 'Market Closed'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sector Allocation Chart */}
        <div className="card">
          <h3 className="text-base font-semibold mb-4">Sector Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SECTOR_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f9fafb' }}
                  itemStyle={{ color: '#f9fafb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {sectorData.map(s => (
              <div key={s.name} className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s.name] || '#6b7280' }}></span>
                <span className="text-text-secondary">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card overflow-hidden !p-0">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-base font-semibold">Holdings ({dashboard.holdings.length})</h3>
        </div>
        
        <div className="flex flex-col">
          {dashboard.holdings.map((holding) => {
            const isExpanded = expandedRow === holding.ticker;
            const isGain = holding.gain_loss >= 0;
            
            return (
              <div key={holding.ticker} className="border-b last:border-b-0 border-border">
                {/* Main Row */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface/50 transition-colors"
                  onClick={() => setExpandedRow(isExpanded ? null : holding.ticker)}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-lg bg-surface flex flex-col justify-center items-center border border-border">
                      <span className="font-bold text-sm">{holding.ticker}</span>
                    </div>
                    <div>
                      <div className="font-medium text-text-primary text-sm flex gap-2 items-center">
                        {holding.shares.toFixed(4)} shs
                      </div>
                      <div className="text-xs text-text-muted mt-1 w-24">
                        <div className="h-1 bg-background rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${holding.allocation_pct}%` }}
                          />
                        </div>
                        <div className="mt-1">{holding.allocation_pct.toFixed(1)}% weight</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono text-sm font-medium">{formatCurrency(holding.market_value)}</div>
                    <div className="text-xs text-text-secondary mt-1">{formatCurrency(holding.current_price)}</div>
                    <div className={cn("text-xs font-medium mt-1 inline-flex items-center", isGain ? "text-success" : "text-danger")}>
                      {isGain ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {formatPercentage(holding.gain_loss_pct)}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-background/50 text-sm grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border">
                    <div>
                      <div className="text-text-muted text-xs mb-1">Cost Basis</div>
                      <div className="font-mono">{formatCurrency(holding.cost_basis)}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Total Return</div>
                      <div className={cn("font-mono font-medium", isGain ? "text-success" : "text-danger")}>
                        {formatCurrency(holding.gain_loss)}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Avg Price</div>
                      <div className="font-mono">{formatCurrency(holding.avg_price)}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Sector</div>
                      <div>{SECTOR_MAP[holding.ticker] || 'Unknown'}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
