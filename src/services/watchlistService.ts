import { get, post, del } from './apiClient'

export interface WatchlistItem {
  ticker: string
  added_at: string
  notes: string | null
  target_price: number | null
  current_price: number
  dividend_yield: number
  pe_ratio: number
  market_cap: number
  score: number
  meets_criteria: boolean
}

export interface WatchlistComparison {
  ticker: string
  vs_holdings: Record<string, unknown>
  allocation_impact: number
  explanation: string
}

export const watchlistService = {
  getWatchlist: () => get<WatchlistItem[]>('/watchlist'),
  addTicker: (ticker: string, notes?: string, target_price?: number) =>
    post<WatchlistItem>('/watchlist', { ticker, notes, target_price }),
  removeTicker: (ticker: string) => del(`/watchlist/${ticker}`),
  getMetrics: (ticker: string) => get<WatchlistItem>(`/watchlist/${ticker}`),
  compare: (ticker: string) =>
    get<WatchlistComparison>(`/watchlist/compare/${ticker}`),
  getPrioritized: () => get<WatchlistItem[]>('/watchlist/prioritized'),
  getAllocationImpact: (ticker: string) =>
    get<{ allocation_impact: number; explanation: string }>(
      `/watchlist/${ticker}/allocation-impact`,
    ),
}
