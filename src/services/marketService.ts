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
    // Local NYSE hours check is the source of truth (backend can be wrong)
    // NYSE: Mon-Fri 9:30-16:00 ET. DST: 2nd Sun Mar → 1st Sun Nov = UTC-4, else UTC-5
    const now = new Date();
    const year = now.getUTCFullYear();
    // DST start: 2nd Sunday of March at 2am ET
    const dstStart = new Date(Date.UTC(year, 2, 8)); // March 8 earliest 2nd Sunday
    dstStart.setUTCDate(8 + (7 - dstStart.getUTCDay()) % 7);
    dstStart.setUTCHours(7); // 2am ET = 7am UTC (EST+5)
    // DST end: 1st Sunday of November at 2am ET
    const dstEnd = new Date(Date.UTC(year, 10, 1)); // Nov 1 earliest 1st Sunday
    dstEnd.setUTCDate(1 + (7 - dstEnd.getUTCDay()) % 7);
    dstEnd.setUTCHours(6); // 2am ET = 6am UTC (EDT+4)
    const isDST = now >= dstStart && now < dstEnd;
    const etOffset = isDST ? -4 : -5;
    const etHour = (now.getUTCHours() + 24 + etOffset) % 24;
    const etMinutes = now.getUTCMinutes();
    const day = now.getUTCDay(); // 0=Sun, 6=Sat
    const etTime = etHour * 60 + etMinutes;
    const locallyOpen = day >= 1 && day <= 5 && etTime >= 570 && etTime < 960; // 9:30-16:00
    return {
      is_open: locallyOpen, // local check is source of truth
      next_open: raw.next_open ?? '',
      next_close: raw.next_close ?? '',
    } as MarketStatus;
  }),
}
