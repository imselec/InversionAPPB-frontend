import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { Minus, Plus, Zap, TrendingUp, Search, Info } from 'lucide-react';

import { recommendationService } from '../services/recommendationService';
import { formatCurrency, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';

export default function Recommendations() {
  const queryClient = useQueryClient();
  const [budget, setBudget] = useState(300);
  const [activeTab, setActiveTab] = useState('buy');
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);

  const { data: latestRes, isLoading: latestLoading, isError: latestError } = useQuery({
    queryKey: ['recommsLatest'], queryFn: recommendationService.getLatest
  });
  const { data: newTickersRes, isLoading: newLoading } = useQuery({
    queryKey: ['recommsNew'], queryFn: recommendationService.getNewTickers
  });
  const { data: sellRes, isLoading: sellLoading } = useQuery({
    queryKey: ['recommsSell'], queryFn: recommendationService.getSell
  });

  const { mutate: generateMutate, isPending: isGenerating } = useMutation({
    mutationFn: (b: number) => recommendationService.generate(b),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommsLatest'] });
      setActiveTab('buy');
    }
  });

  const handleAdjustBudget = (amount: number) => {
    setBudget(prev => Math.max(50, prev + amount));
  };

  const handleGenerate = () => {
    generateMutate(budget);
  };

  const isLoading = latestLoading;  // Only block on primary query

  const latest = latestRes;
  const newTickers = Array.isArray(newTickersRes) ? newTickersRes : [];
  const sellRecomms = Array.isArray(sellRes) ? sellRes : [];

  const buyRecomms = Array.isArray(latest?.recommendations)
    ? latest.recommendations.filter((r: any) => r.action === 'BUY').sort((a: any, b: any) => a.priority - b.priority)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
        <LoadingSkeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Control Panel */}
      <div className="card bg-surface/80 border-primary/20 bg-gradient-to-b from-surface to-surface/95">
        <h2 className="text-sm font-medium text-text-secondary mb-4 text-center">Monthly Budget</h2>
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <button 
            onClick={() => handleAdjustBudget(-50)}
            disabled={budget <= 50}
            className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            <Minus className="w-5 h-5" />
          </button>
          
          <div className="text-4xl font-bold font-mono tracking-tighter w-40 text-center">
            {formatCurrency(budget)}
          </div>
          
          <button 
            onClick={() => handleAdjustBudget(50)}
            className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full btn-primary py-3.5 text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {isGenerating ? <Zap className="w-5 h-5 animate-pulse" /> : <Zap className="w-5 h-5" />}
          {isGenerating ? 'Analyzing Portfolio...' : 'Generate Recommendations'}
        </button>
        
        {latest?.executed_at && (
          <div className="text-center mt-4 text-xs text-text-muted">
            Last generated {new Date(latest.executed_at).toLocaleString()}
          </div>
        )}
      </div>

      {!latest && !isGenerating && !latestError ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center text-text-secondary border-dashed">
          <Info className="w-12 h-12 mb-4 text-text-muted" />
          <p>No recommendations yet. Tap Generate to analyze your portfolio.</p>
        </div>
      ) : (
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="card !p-0 overflow-hidden">
          <Tabs.List className="flex border-b border-border bg-surface">
            <Tabs.Trigger 
              value="buy" 
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
                activeTab === 'buy' ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/50"
              )}
            >
              Buy <Badge variant="primary" className="ml-1 px-1.5 py-0 h-4 text-[10px]">{buyRecomms.length}</Badge>
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="new" 
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
                activeTab === 'new' ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/50"
              )}
            >
              New Tickers
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="sell" 
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
                activeTab === 'sell' ? "border-danger text-danger" : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/50"
              )}
            >
              Sell {sellRecomms.length > 0 && <Badge variant="danger" className="ml-1 px-1.5 py-0 h-4 text-[10px]">{sellRecomms.length}</Badge>}
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="buy" className="p-0 outline-none divide-y divide-border">
            {buyRecomms.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No buy recommendations generated for this budget.</div>
            ) : (
              buyRecomms.map((rec) => {
                const isTop = rec.priority === 1;
                const isExpanded = expandedReasoning === rec.ticker;
                
                return (
                  <div key={rec.ticker} className={cn("p-4 transition-colors", isTop ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-background/30")}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm",
                          isTop ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-surface border border-border text-text-primary"
                        )}>
                          #{rec.priority}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{rec.ticker}</h3>
                          {isTop && <span className="text-xs text-primary font-medium">Top Pick</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          Buy <span className="font-bold">{rec.shares} shs</span> @ {formatCurrency(rec.price)}
                        </div>
                        <div className="font-mono font-medium text-primary mt-0.5">
                          = {formatCurrency(rec.total_cost)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Score Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted">Recommendation Score</span>
                        <span className="font-medium text-primary">{rec.score}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${rec.score}%` }} />
                      </div>
                    </div>

                    <div className="text-sm text-text-secondary leading-relaxed">
                      {isExpanded ? rec.reasoning : `${rec.reasoning.substring(0, 100)}... `}
                      <button 
                        onClick={() => setExpandedReasoning(isExpanded ? null : rec.ticker)}
                        className="text-primary font-medium hover:underline text-xs ml-1"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </Tabs.Content>

          <Tabs.Content value="new" className="p-0 outline-none divide-y divide-border">
            {newTickers.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No new ticker suggestions available.</div>
            ) : (
              newTickers.map((ticker) => (
                <div key={ticker.ticker} className="p-4 hover:bg-background/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border">
                        <TrendingUp className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{ticker.ticker}</div>
                        <div className="text-xs text-text-muted">{ticker.sector} • {ticker.industry}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm bg-background/50 p-3 rounded-lg border border-border/50">
                    <div>
                      <div className="text-text-muted text-xs mb-1">Score</div>
                      <div className="font-medium text-primary">{ticker.score}/100</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs mb-1">Alloc. Impact</div>
                      <div className="font-medium text-success">+{ticker.allocation_impact.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-text-secondary mt-3">
                    <span className="text-text-primary text-xs font-medium uppercase tracking-wider block mb-1">Why consider this?</span>
                    {ticker.diversification_explanation || ticker.reasoning}
                  </p>
                  
                  <button className="mt-4 w-full py-2 bg-surface hover:bg-background border border-border rounded-lg text-sm font-medium transition-colors flex flex-row justify-center items-center gap-2">
                     <Search className="w-4 h-4"/> Add to Watchlist
                  </button>
                </div>
              ))
            )}
          </Tabs.Content>

          <Tabs.Content value="sell" className="p-0 outline-none divide-y divide-border">
            {sellRecomms.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">No Sell Recommendations</h3>
                <p className="text-sm text-text-secondary max-w-xs">Your portfolio looks healthy. We don't recommend selling any holdings right now.</p>
              </div>
            ) : (
              sellRecomms.map((rec) => {
                const isExpanded = expandedReasoning === `sell_${rec.ticker}`;
                const isGain = rec.gain_loss >= 0;
                
                return (
                  <div key={rec.ticker} className="p-4 hover:bg-background/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{rec.ticker}</h3>
                          <Badge variant="warning">{rec.reason.substring(0, 12)}...</Badge>
                        </div>
                        <div className="text-sm">
                          Sell <span className="font-bold text-danger">{rec.shares_to_sell} shs</span> @ {formatCurrency(rec.current_price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-text-muted mb-1">Holding Period</div>
                        <div className="text-sm font-medium">{rec.holding_period_days} days</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 my-3 text-sm bg-background/50 p-3 rounded-lg border border-border/50">
                      <div>
                        <div className="text-text-muted text-xs mb-1">Est. Gain/Loss</div>
                        <div className={cn("font-medium", isGain ? "text-success" : "text-danger")}>
                          {isGain ? '+' : ''}{formatCurrency(rec.gain_loss)}
                        </div>
                      </div>
                      <div>
                        <div className="text-text-muted text-xs mb-1">Est. Tax Impact</div>
                        <div className="font-medium text-warning">
                          {formatCurrency((rec.tax_short_term || 0) + (rec.tax_long_term || 0))}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-text-secondary leading-relaxed">
                      {isExpanded ? rec.reason : `${rec.reason.substring(0, 100)}... `}
                      <button 
                        onClick={() => setExpandedReasoning(isExpanded ? null : `sell_${rec.ticker}`)}
                        className="text-primary font-medium hover:underline text-xs ml-1"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </Tabs.Content>
        </Tabs.Root>
      )}
    </div>
  );
}
