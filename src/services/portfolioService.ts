import { get, post, put, del } from './apiClient'

export interface Holding {
  ticker: string
  shares: number
  avg_price: number | null
  current_price: number
  market_value: number
  cost_basis: number | null
  gain_loss: number | null
  gain_loss_pct: number | null
  allocation_pct: number
}

export interface PortfolioDashboard {
  total_value: number
  total_invested: number
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

// Backend returns "positions" with field "price"/"value" — map to frontend shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPosition(p: any): Holding {
  return {
    ticker: p.ticker,
    shares: p.shares,
    avg_price: p.avg_price ?? null,
    current_price: p.price ?? p.current_price ?? 0,
    market_value: p.value ?? p.market_value ?? 0,
    cost_basis: p.cost_basis ?? null,
    gain_loss: p.gain_loss ?? null,
    gain_loss_pct: p.gain_loss_pct ?? null,
    allocation_pct: p.allocation_pct ?? 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDashboard(raw: any): PortfolioDashboard {
  const positions = raw.positions ?? raw.holdings ?? []
  return {
    total_value: raw.total_value ?? 0,
    total_invested: raw.total_invested ?? 0,
    total_gain_loss: raw.total_gain_loss ?? 0,
    total_gain_loss_pct: raw.total_gain_loss_pct ?? 0,
    holdings: positions.map(mapPosition),
    last_updated: raw.last_updated ?? new Date().toISOString(),
  }
}

export const portfolioService = {
  getDashboard: () => get<PortfolioDashboard>('/portfolio/dashboard').then(mapDashboard),
  getSnapshot: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<any>('/portfolio/snapshot').then((raw) => ({
      holdings: (raw.positions ?? raw.holdings ?? []).map(mapPosition),
    })),
  getAllocation: () => get<PortfolioAllocation[]>('/portfolio/allocation'),
  getHistory: (params?: { start_date?: string; end_date?: string }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<any>('/portfolio/history', params).then((raw) => raw.transactions ?? raw ?? []),
  postTransaction: (data: Omit<Transaction, 'id'>) =>
    post<Transaction>('/portfolio/transaction', data),
  updateHolding: (ticker: string, shares: number, avg_price?: number) =>
    put<{ ticker: string; shares: number; avg_price: number | null }>(
      `/portfolio/holding/${ticker}`, { shares, avg_price: avg_price ?? null }
    ),
  deleteHolding: (ticker: string) =>
    del<{ deleted: string }>(`/portfolio/holding/${ticker}`),
}
