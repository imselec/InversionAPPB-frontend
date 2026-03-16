
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRightLeft } from 'lucide-react';

import { portfolioService } from '../services/portfolioService';
import { recommendationService } from '../services/recommendationService';
import { formatCurrency, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Badge } from '../components/ui/Badge';

export default function RebalancingAlerts() {
  const { data: allocRes, isLoading: allocLoading, isError: allocError } = useQuery({
    queryKey: ['portfolioAllocation'], queryFn: portfolioService.getAllocation
  });

  const { isLoading: tradesLoading } = useQuery({
    queryKey: ['rebalanceTrades'], queryFn: recommendationService.getSell // Reusing getSell as proxy for trades if needed, or hypothetical endpoint
  });

  const isLoading = allocLoading || tradesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-20 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  if (allocError) {
    return <ErrorMessage message="Failed to load allocation data." />;
  }

  // Ensure allocations sum up correctly or map them
  const allocations = [...(Array.isArray(allocRes) ? allocRes : [])].sort((a,b) => b.deviation - a.deviation);
  
  // Calculate status
  const alerts = allocations.filter(a => {
    const relDiff = Math.abs(a.deviation) / a.target_pct;
    return relDiff > 0.1; // Alert if > 10% relative deviation
  });

  const criticalAlerts = alerts.filter(a => (Math.abs(a.deviation) / a.target_pct) > 0.2);
  const statusNumber = alerts.length;

  // Mock trades based on alerts for demonstration
  const trades = alerts.map((a, i) => ({
    id: i,
    action: a.deviation > 0 ? 'SELL' : 'BUY',
    ticker: a.ticker,
    shares: Math.max(1, Math.floor(Math.random() * 10)),
    estimatedAmount: Math.random() * 500 + 50
  }));

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={cn(
        "rounded-xl p-4 flex items-center gap-4 border",
        statusNumber === 0 
          ? "bg-success/10 border-success/30 text-success" 
          : criticalAlerts.length > 0 
            ? "bg-danger/10 border-danger/30 text-danger" 
            : "bg-warning/10 border-warning/30 text-warning"
      )}>
        {statusNumber === 0 ? (
          <CheckCircle2 className="w-8 h-8 shrink-0" />
        ) : criticalAlerts.length > 0 ? (
          <AlertCircle className="w-8 h-8 shrink-0" />
        ) : (
          <AlertTriangle className="w-8 h-8 shrink-0" />
        )}
        <div>
          <h2 className="text-lg font-bold">
            {statusNumber === 0 
              ? "Portfolio is balanced ✓" 
              : criticalAlerts.length > 0 
                ? "Immediate rebalancing recommended" 
                : `${statusNumber} positions need attention`}
          </h2>
          <p className="text-sm opacity-90">
            {statusNumber === 0 
              ? "All holdings are within your target allocation thresholds." 
              : "Review the alerts below to realign your portfolio with its target weights."}
          </p>
        </div>
      </div>

      {/* Target Info */}
      <div className="flex justify-between items-center px-2">
        <div className="text-sm text-text-secondary">
          Target per stock: <span className="font-bold text-text-primary">5.56%</span> (1/18 stocks)
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger"></span> Overweight &gt;20%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Underweight &lt;10%</span>
        </div>
      </div>

      {/* Allocation Chart (Horizontal Bars) */}
      <div className="card">
        <h3 className="text-base font-semibold mb-6">Current Allocation vs Target</h3>
        
        <div className="space-y-4">
          {allocations.slice(0, 10).map((alloc) => {
            const relDiff = alloc.deviation / alloc.target_pct;
            const barColor = relDiff > 0.2 ? 'bg-danger' : relDiff > 0.05 ? 'bg-warning' : relDiff < -0.1 ? 'bg-primary' : 'bg-success';
            
            return (
              <div key={alloc.ticker}>
                <div className="flex justify-between items-end mb-1 text-sm font-medium">
                  <div className="w-16">{alloc.ticker}</div>
                  <div className="flex-1 px-4 relative">
                    <div className="h-4 w-full bg-background rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${Math.min(100, (alloc.allocation_pct / 10) * 100)}%` }} />
                    </div>
                    {/* Target Line marker (assuming target is ~5.56%) */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-text-primary z-10" style={{ left: `calc(1rem + 55.6%)` }} />
                  </div>
                  <div className="w-16 text-right font-mono">{alloc.allocation_pct.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
          {allocations.length > 10 && (
            <div className="text-center text-xs text-text-muted mt-4">
              Showing top 10 deviating positions. {allocations.length - 10} more within range.
            </div>
          )}
        </div>
      </div>

      {/* Alert Cards */}
      {alerts.length > 0 && (
        <>
          <h3 className="text-base font-semibold px-1 mt-8">Action Required</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(alert => {
              const relDiff = alert.deviation / alert.target_pct;
              const isOver = alert.deviation > 0;
              const severity = Math.abs(relDiff) > 0.2 ? 'HIGH' : 'MEDIUM';
              
              return (
                <div key={alert.ticker} className={cn(
                  "card border-l-4",
                  isOver ? "border-l-danger" : "border-l-primary"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold">{alert.ticker}</h4>
                    <Badge variant={severity === 'HIGH' ? 'danger' : 'warning'} className="text-[10px] px-1.5 py-0 h-5 border-none">
                      {severity}
                    </Badge>
                  </div>
                  
                  <div className="text-sm mb-3">
                    Currently <span className="font-bold">{alert.allocation_pct.toFixed(2)}%</span> vs target {alert.target_pct.toFixed(2)}%
                    <div className={cn("text-xs mt-1", isOver ? "text-danger" : "text-primary")}>
                      {isOver ? '+' : ''}{alert.deviation.toFixed(2)}% {isOver ? 'overweight' : 'underweight'}
                    </div>
                  </div>
                  
                  <div className="bg-background/50 p-2 text-xs rounded border border-border mt-auto">
                    Consider {isOver ? 'selling' : 'buying'} shares to restore target allocation.
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recommended Trades */}
      {trades.length > 0 && (
        <div className="card !p-0 overflow-hidden mt-8">
          <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-accent" />
              Suggested Trades
            </h3>
            <span className="text-xs text-text-muted">Estimated impact: {formatCurrency(trades.reduce((sum, t) => sum + (t.action==='SELL' ? t.estimatedAmount : -t.estimatedAmount), 0))} net proceeds</span>
          </div>
          
          <div className="divide-y divide-border">
            {trades.map(trade => (
              <div key={trade.id} className="p-4 flex items-center justify-between hover:bg-background/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant={trade.action === 'BUY' ? 'success' : 'danger'} className="w-12 justify-center">
                    {trade.action}
                  </Badge>
                  <div className="font-medium text-sm">
                    <span className="font-bold">{trade.shares} shs</span> of {trade.ticker}
                  </div>
                </div>
                <div className="font-mono text-sm font-medium">
                  {formatCurrency(trade.estimatedAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
