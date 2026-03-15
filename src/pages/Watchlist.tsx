import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, BookmarkPlus, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';

import { watchlistService } from '../services/watchlistService';
import { formatCurrency, formatPercentage, cn } from '../utils/utils';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Badge } from '../components/ui/Badge';
import * as Dialog from '@radix-ui/react-dialog';

export default function Watchlist() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'yield' | 'pe'>('score');
  
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedTickerForCompare, setSelectedTickerForCompare] = useState<string | null>(null);

  const { data: watchlistRes, isLoading: watchlistLoading, isError: watchlistError } = useQuery({
    queryKey: ['watchlist'], queryFn: watchlistService.getWatchlist
  });

  const { data: compareRes, isLoading: compareLoading } = useQuery({
    queryKey: ['watchlistCompare', selectedTickerForCompare],
    queryFn: () => watchlistService.compare(selectedTickerForCompare!),
    enabled: !!selectedTickerForCompare
  });

  const { mutate: addTicker, isPending: isAdding } = useMutation({
    mutationFn: (ticker: string) => watchlistService.addTicker(ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setSearchInput('');
      setSearchError('');
    },
    onError: () => {
      setSearchError('Error adding ticker. Check symbol and try again.');
    }
  });

  const { mutate: removeTicker } = useMutation({
    mutationFn: (ticker: string) => watchlistService.removeTicker(ticker),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] })
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    // Simulate validation
    const val = searchInput.toUpperCase().trim();
    if (val.length < 1 || val.length > 5) {
      setSearchError('Invalid ticker format');
      return;
    }
    
    addTicker(val);
  };

  const openCompare = (ticker: string) => {
    setSelectedTickerForCompare(ticker);
    setCompareModalOpen(true);
  };

  if (watchlistLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-16 w-full" />
        <LoadingSkeleton className="h-12 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (watchlistError) {
    return <ErrorMessage message="Failed to load watchlist." />;
  }

  let items = watchlistRes || [];
  
  // Sort
  items = [...items].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'yield') return b.dividend_yield - a.dividend_yield;
    return a.pe_ratio - b.pe_ratio; // Lower P/E is usually "better" so ascending
  });

  return (
    <div className="space-y-6">
      
      {/* Search Bar */}
      <div className="card">
        <form onSubmit={handleAdd} className="flex gap-2 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value.toUpperCase());
                setSearchError('');
              }}
              placeholder="Add ticker (e.g., MSFT)"
              className={cn(
                "w-full bg-background border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors uppercase",
                searchError ? "border-danger" : "border-border"
              )}
            />
          </div>
          <button 
            type="submit" 
            disabled={isAdding || !searchInput.trim()}
            className="btn-primary"
          >
            {isAdding ? 'Adding...' : 'Add'}
          </button>
        </form>
        {searchError && <div className="text-danger text-xs mt-2 pl-2">{searchError}</div>}
      </div>

      {/* Sort Options */}
      <div className="flex bg-surface border border-border rounded-lg p-1 w-full max-w-sm mx-auto">
        {(['score', 'yield', 'pe'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
              sortBy === s ? "bg-background text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            )}
          >
            By {s === 'pe' ? 'P/E' : s}
          </button>
        ))}
      </div>

      {/* Watchlist Items */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <BookmarkPlus className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Watchlist is empty</h3>
            <p className="text-sm text-text-secondary max-w-xs">Add tickers you want to monitor before deciding to invest in them.</p>
          </div>
        ) : (
          items.map(item => {
            const isPositive = (item as any).dailyChangePercentage >= 0 || true; // Mock daily change
            
            return (
              <div key={item.ticker} className="card !p-0 overflow-hidden relative group">
                {/* Remove Button - Top right corner */}
                <button 
                  onClick={() => removeTicker(item.ticker)}
                  className="absolute top-2 right-2 p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger rounded-md transition-colors z-10 opacity-0 group-hover:opacity-100 md:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="p-4 border-b border-border">
                  <div className="flex justify-between items-start pr-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center border border-border">
                        <span className="font-bold text-lg">{item.ticker}</span>
                      </div>
                      <div>
                        {/* Fake Company Name */}
                        <div className="text-sm text-text-secondary">{item.ticker} Corp.</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-mono font-bold">{formatCurrency(item.current_price)}</span>
                          <span className={cn("text-xs font-medium flex items-center", isPositive ? "text-success" : "text-danger")}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {formatPercentage(1.24)} {/* Mock */}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {item.meets_criteria && (
                      <Badge variant="success" className="text-[10px] hidden sm:flex">Meets Criteria</Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-background/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-text-muted text-xs mb-1">Div Yield</div>
                    <div className="font-medium text-warning">{formatPercentage(item.dividend_yield/100)}</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">P/E Ratio</div>
                    <div className="font-medium">{item.pe_ratio.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Market Cap</div>
                    <div className="font-medium">${(item.market_cap / 1e9).toFixed(1)}B</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1 flex justify-between">
                      <span>Score</span>
                      <span className="font-medium text-primary">{item.score}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-border flex justify-between items-center bg-surface/50">
                  <div className="text-xs text-text-secondary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    <span className="font-medium text-success">+5.5%</span> if added
                  </div>
                  <button 
                    onClick={() => openCompare(item.ticker)}
                    className="text-xs flex items-center gap-1 font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Scale className="w-4 h-4" /> Compare
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comparison Modal */}
      <Dialog.Root open={compareModalOpen} onOpenChange={setCompareModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg bg-surface border border-border rounded-xl shadow-xl z-50 p-0 overflow-hidden outline-none animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95">
            <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
              <h3 className="text-lg font-bold">Compare Ticker</h3>
              <Dialog.Close className="text-text-secondary hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            
            {compareLoading ? (
              <div className="p-6 space-y-4">
                <LoadingSkeleton className="h-8 w-full" />
                <LoadingSkeleton className="h-48 w-full" />
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-accent">{selectedTickerForCompare}</div>
                    <div className="text-xs text-text-muted">Watchlist</div>
                  </div>
                  <div className="px-4 text-text-muted">vs</div>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold">AVGO</div>
                    <div className="text-xs text-text-muted">Current Holding</div>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  {[
                    { label: 'Yield', t1: '2.8%', t2: '1.5%', match: true },
                    { label: 'P/E Ratio', t1: '15.4', t2: '45.2', match: true },
                    { label: 'Market Cap', t1: '$120B', t2: '$550B', match: false },
                    { label: 'Sector', t1: 'Tech', t2: 'Tech', match: false },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                      <div className={cn("flex-1 text-center font-medium", row.match ? "text-success" : "")}>{row.t1}</div>
                      <div className="flex-1 text-center text-text-muted text-xs uppercase tracking-wider">{row.label}</div>
                      <div className="flex-1 text-center font-medium text-text-secondary">{row.t2}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-xs text-primary font-bold uppercase mb-1">Why add this?</div>
                  <p className="text-sm text-text-primary">
                    {compareRes?.explanation || `Adding ${selectedTickerForCompare} provides better dividend yield at a more reasonable valuation while maintaining technology sector exposure.`}
                  </p>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <Dialog.Close className="flex-1 btn-ghost border border-border">Close</Dialog.Close>
                  <button className="flex-1 btn-primary">Switch Holdings</button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
