import { get, post } from './apiClient'

export interface Recommendation {
  ticker: string
  action: 'BUY' | 'SELL' | 'HOLD'
  shares: number
  price: number
  total_cost: number
  score: number
  reasoning: string
  priority: number
}

export interface RecommendationRun {
  id: number
  executed_at: string
  budget: number
  total_allocated: number
  portfolio_value: number
  recommendations: Recommendation[]
}

export interface SellRecommendation {
  ticker: string
  shares_to_sell: number
  current_price: number
  reason: string
  gain_loss: number
  holding_period_days: number
  tax_short_term: number
  tax_long_term: number
}

export interface NewTickerRecommendation {
  ticker: string
  sector: string
  industry: string
  diversification_explanation: string
  allocation_impact: number
  score: number
  reasoning: string
}

export const recommendationService = {
  generate: (budget: number) =>
    post<RecommendationRun>('/recommendations/generate', { budget }),
  getLatest: () => get<RecommendationRun>('/recommendations/latest'),
  getHistory: () => get<RecommendationRun[]>('/recommendations/history'),
  getNewTickers: () =>
    post<{ recommendations: NewTickerRecommendation[] }>(
      '/recommendations/new-tickers', {}
    ),
  getSell: () =>
    post<SellRecommendation[]>('/recommendations/sell', {}),
}
