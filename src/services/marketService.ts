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
  getStatus: () => get<MarketStatus>('/market/status'),
}
