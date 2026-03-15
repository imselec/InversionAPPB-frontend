import { get, post } from './apiClient'

export interface DividendSummary {
  monthly_total: number
  yearly_total: number
  by_month: Record<string, number>
}

export interface DividendByTicker {
  ticker: string
  yield_pct: number
  annual_amount: number
  last_payment_date: string
  last_payment_amount: number
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

export const dividendService = {
  getSummary: () => get<DividendSummary>('/dividends/summary'),
  getByTicker: () => get<DividendByTicker[]>('/dividends/by-ticker'),
  getHistory: () => get<DividendPayment[]>('/dividends/history'),
  getChart: () => get<DividendChartPoint[]>('/dividends/chart'),
  postReinvestment: (data: { ticker: string; amount: number; shares: number; date: string }) =>
    post('/dividends/reinvestment', data),
}
