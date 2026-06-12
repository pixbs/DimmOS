// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ContentErrorBoundary } from '@/components/window/content-error-boundary'

let shouldThrow = true

function MaybeBoom() {
  if (shouldThrow) throw new Error('boom')
  return <div>recovered content</div>
}

describe('ContentErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    // React logs caught boundary errors — keep test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders the fallback when a child throws', () => {
    render(
      <ContentErrorBoundary>
        <MaybeBoom />
      </ContentErrorBoundary>,
    )
    expect(screen.getByText(/an error has occurred/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /retry/i })).toBeDefined()
  })

  it('clicking Retry calls onRetry and re-renders children', () => {
    const onRetry = vi.fn(() => {
      shouldThrow = false
    })
    render(
      <ContentErrorBoundary onRetry={onRetry}>
        <MaybeBoom />
      </ContentErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getByText('recovered content')).toBeDefined()
  })
})
