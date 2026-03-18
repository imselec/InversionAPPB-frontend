import { get, put } from './apiClient'

export interface BudgetSettings {
  monthly_budget: number
}

export interface AllocationTargets {
  targets: Record<string, number>
}

export const settingsService = {
  getBudget: () => get<BudgetSettings>('/settings/budget'),
  updateBudget: (budget: number) =>
    put<BudgetSettings>('/settings/budget', { budget }),
  getAllocationTargets: () => get<AllocationTargets>('/settings/allocation-targets'),
  updateAllocationTargets: (targets: Record<string, number>) =>
    put<AllocationTargets>('/settings/allocation-targets', { targets }),
}
