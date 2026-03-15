import { get, post } from './apiClient'

export interface Holding {
  ticker: string
  shares: number
  avg_price: number
  current_price: number
  market_value: number
  cost_basis: number
  gain_loss: number
  gain_loss_pct: number
  allocation_pct: number
}

export interface PortfolioDashboard {
  total_value: number
  total_cost_basis: number
  total_gain_loss: number
  total_gain_loss_pct: number
  holdings: Holding[]
  last_updated: string
}

export interface PortfolioAllocation {
  ticker: string
  allocation_pct: number
  target_pct: number
  deviation: number
}

export interface Transaction {
  id: number
  date: string
  ticker: string
  action: 'BUY' | 'SELL'
  shares: number
  price: number
  total_amount: number
  transaction_type: string
}

export const portfolioService = {
  getDashboard: () => get<PortfolioDashboard>('/portfolio/dashboard'),
  getSnapshot: () => get<{ holdings: Holding[] }>('/portfolio/snapshot'),
  getAllocation: () => get<PortfolioAllocation[]>('/portfolio/allocation'),
  getHistory: (params?: { start_date?: string; end_date?: string }) =>
    get<Transaction[]>('/portfolio/history', params),
  postTransaction: (data: Omit<Transaction, 'id'>) =>
    post<Transaction>('/portfolio/transaction', data),
}
