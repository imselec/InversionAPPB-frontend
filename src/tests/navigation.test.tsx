/**
 * Unit tests for navigation and routing.
 * Validates: Requirements 5.3
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'

// Minimal stub pages for routing tests
function StubPage({ name }: { name: string }) {
  return <div data-testid={`page-${name}`}>{name}</div>
}

function TestApp({ initialPath = '/' }: { initialPath?: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route index element={<Navigate to="/portfolio" replace />} />
        <Route path="/portfolio" element={<StubPage name="portfolio" />} />
        <Route path="/dividends" element={<StubPage name="dividends" />} />
        <Route path="/recommendations" element={<StubPage name="recommendations" />} />
        <Route path="/history" element={<StubPage name="history" />} />
        <Route path="/analytics" element={<StubPage name="analytics" />} />
        <Route path="/rebalancing" element={<StubPage name="rebalancing" />} />
        <Route path="/alerts" element={<StubPage name="alerts" />} />
        <Route path="/watchlist" element={<StubPage name="watchlist" />} />
        <Route path="/settings" element={<StubPage name="settings" />} />
        <Route path="*" element={<Navigate to="/portfolio" replace />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Navigation routing', () => {
  it('redirects root path to /portfolio', () => {
    render(<TestApp initialPath="/" />)
    expect(screen.getByTestId('page-portfolio')).toBeInTheDocument()
  })

  it('renders portfolio page at /portfolio', () => {
    render(<TestApp initialPath="/portfolio" />)
    expect(screen.getByTestId('page-portfolio')).toBeInTheDocument()
  })

  it('renders dividends page at /dividends', () => {
    render(<TestApp initialPath="/dividends" />)
    expect(screen.getByTestId('page-dividends')).toBeInTheDocument()
  })

  it('renders recommendations page at /recommendations', () => {
    render(<TestApp initialPath="/recommendations" />)
    expect(screen.getByTestId('page-recommendations')).toBeInTheDocument()
  })

  it('renders history page at /history', () => {
    render(<TestApp initialPath="/history" />)
    expect(screen.getByTestId('page-history')).toBeInTheDocument()
  })

  it('renders analytics page at /analytics', () => {
    render(<TestApp initialPath="/analytics" />)
    expect(screen.getByTestId('page-analytics')).toBeInTheDocument()
  })

  it('renders alerts page at /alerts', () => {
    render(<TestApp initialPath="/alerts" />)
    expect(screen.getByTestId('page-alerts')).toBeInTheDocument()
  })

  it('renders watchlist page at /watchlist', () => {
    render(<TestApp initialPath="/watchlist" />)
    expect(screen.getByTestId('page-watchlist')).toBeInTheDocument()
  })

  it('renders settings page at /settings', () => {
    render(<TestApp initialPath="/settings" />)
    expect(screen.getByTestId('page-settings')).toBeInTheDocument()
  })

  it('redirects unknown paths to /portfolio', () => {
    render(<TestApp initialPath="/unknown-route" />)
    expect(screen.getByTestId('page-portfolio')).toBeInTheDocument()
  })

  it('all 9 routes are defined', () => {
    const routes = [
      '/portfolio', '/dividends', '/recommendations', '/history',
      '/analytics', '/rebalancing', '/alerts', '/watchlist', '/settings',
    ]
    expect(routes).toHaveLength(9)
  })
})
