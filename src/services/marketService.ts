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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStatus: () => get<any>('/market/status').then((raw) => {
    const backendOpen = raw.is_open ?? raw.market_open ?? false;
    // Local fallback: NYSE hours Mon-Fri 9:30-16:00 ET (UTC-4 summer / UTC-5 winter)
    const now = new Date();
    const etOffset = -5; // EST; adjust for DST if needed
    const etHour = (now.getUTCHours() + 24 + etOffset) % 24;
    const etMinutes = now.getUTCMinutes();
    const day = now.getUTCDay(); // 0=Sun, 6=Sat
    const etTime = etHour * 60 + etMinutes;
    const locallyOpen = day >= 1 && day <= 5 && etTime >= 570 && etTime < 960; // 9:30-16:00
    return {
      is_open: backendOpen && locallyOpen,
      next_open: raw.next_open ?? '',
      next_close: raw.next_close ?? '',
    } as MarketStatus;
  }),
}
