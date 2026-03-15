import { get } from './apiClient'

export interface PerformanceMetrics {
  total_return_pct: number
  annualized_return_pct: number
  portfolio_yield_pct: number
  volatility: number
  sp500_comparison: number
}

export interface TickerReturn {
  ticker: string
  total_return_pct: number
  cost_basis: number
  current_value: number
  gain_loss: number
}

export const analyticsService = {
  getPerformance: (period?: string) =>
    get<PerformanceMetrics>('/analytics/performance', period ? { period } : undefined),
  getReturns: () => get<TickerReturn[]>('/analytics/returns'),
  getVolatility: () => get<{ volatility: number; beta: number }>('/analytics/volatility'),
  getComparison: () => get<{ portfolio: number; sp500: number }>('/analytics/comparison'),
}
