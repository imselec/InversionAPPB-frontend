import { get, post, put, del } from './apiClient'

export interface Alert {
  id: number
  user_id: number
  alert_type: 'price' | 'dividend' | 'rebalancing' | 'monthly_investment' | 'news'
  ticker: string | null
  target_price: number | null
  enabled: boolean
  last_triggered: string | null
  created_at: string
  updated_at: string
}

export interface NotificationHistory {
  id: number
  alert_type: string
  ticker: string | null
  message: string
  sent_at: string
  delivered: boolean
  read: boolean
}

export const alertService = {
  getAlerts: () => get<Alert[]>('/alerts'),
  createAlert: (data: Omit<Alert, 'id' | 'user_id' | 'last_triggered' | 'created_at' | 'updated_at'>) =>
    post<Alert>('/alerts', data),
  updateAlert: (id: number, data: Partial<Alert>) =>
    put<Alert>(`/alerts/${id}`, data),
  deleteAlert: (id: number) => del(`/alerts/${id}`),
  toggleAlert: (id: number) => put<Alert>(`/alerts/${id}/toggle`, {}),
  getHistory: (limit = 50) =>
    get<NotificationHistory[]>('/alerts/history', { limit }),
  evaluate: () => post('/alerts/evaluate', {}),
}
