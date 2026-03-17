import { get, post } from './apiClient'

export interface DividendSummary {
  monthly_total: number
  yearly_total: number
  total_all_time: number
}

export interface DividendByTicker {
  ticker: string
  yield_pct: number
  annual_amount: number
  last_payment_date: string
  last_payment_amount: number
  total_dividends: number
  payment_count: number
}

export interface DividendPayment {
  id: number
  ticker: string
  payment_date: string
  amount: number
  shares_owned: number
  per_share_amount: number
  reinvested: boolean
}

export interface DividendChartPoint {
  month: string
  amount: number
}

export interface ManualDividendRequest {
  ticker: string
  payment_date: string
  per_share_amount: number
  reinvested: boolean
}

export const dividendService = {
  getSummary: () => get<DividendSummary>('/dividends/summary'),
  getByTicker: () => get<DividendByTicker[]>('/dividends/by-ticker'),
  getHistory: () => get<DividendPayment[]>('/dividends/history'),
  getChart: () => get<DividendChartPoint[]>('/dividends/chart'),
  importHistorical: () => post<{ imported: number; skipped: number }>(
    '/dividends/import', {}
  ),
  recordManual: (data: ManualDividendRequest) =>
    post('/dividends/record', data),
  postReinvestment: (data: {
    ticker: string
    dividend_amount: number
    reinvestment_price: number
  }) => post('/dividends/reinvestment', data),
}
