import { get } from './apiClient'

export interface PriceData {
  ticker: string
  price: number
  change: number
  change_pct: number
  is_stale: boolean
  timestamp: string
}

export interface MarketStatus {
  is_open: boolean
  next_open: string
  next_close: string
}

export const marketService = {
  getPrices: (tickers?: string[]) =>
    get<Record<string, PriceData>>('/market/prices', tickers ? { tickers: tickers.join(',') } : undefined),
  getChanges: () => get<Record<string, PriceData>>('/market/changes'),
  // Backend returns { market_open: bool } — map to { is_open: bool }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStatus: () => get<any>('/market/status').then((raw) => ({
    is_open: raw.is_open ?? raw.market_open ?? false,
    next_open: raw.next_open ?? '',
    next_close: raw.next_close ?? '',
  } as MarketStatus)),
}
