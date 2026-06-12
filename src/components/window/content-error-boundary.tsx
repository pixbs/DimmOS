'use client'

import { Component, type ReactNode } from 'react'

interface ContentErrorBoundaryProps {
  children: ReactNode
  /** Re-create the content promise before the boundary resets (the failed one was evicted from cache). */
  onRetry?: () => void
}

interface ContentErrorBoundaryState {
  hasError: boolean
}

/**
 * Catches content-loading failures (rejected window content promise thrown by
 * use()) that Suspense alone would leave as a permanently stuck fallback.
 */
export class ContentErrorBoundary extends Component<
  ContentErrorBoundaryProps,
  ContentErrorBoundaryState
> {
  state: ContentErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ContentErrorBoundaryState {
    return { hasError: true }
  }

  handleRetry = () => {
    this.props.onRetry?.()
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-content-error=""
          className="flex-1 flex h-full rounded-2xl flex-col p-8 font-mono text-sm leading-relaxed"
          style={{ background: '#F22F57', color: 'white' }}
        >
          <p className="text-5xl mb-6 leading-none select-none">:(</p>
          <p className="uppercase tracking-wider font-semibold mb-5">An error has occurred.</p>
          <p className="uppercase tracking-wide leading-loose mb-5 opacity-90 text-xs">
            This window&apos;s content could not be loaded. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="self-start px-5 py-2 rounded-full font-semibold uppercase tracking-wider text-xs bg-white/90 hover:bg-white transition-colors cursor-pointer"
            style={{ color: '#F22F57' }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
