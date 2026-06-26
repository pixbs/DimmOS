import { StrictMode, type ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWindowManager } from '@/hooks/useWindowManager'

const navigation = vi.hoisted(() => ({
  pathname: '/',
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}))

function StrictWrapper({ children }: { children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>
}

describe('useWindowManager', () => {
  beforeEach(() => {
    navigation.pathname = '/'
    navigation.push.mockClear()
    window.sessionStorage.clear()
    window.history.replaceState(null, '', '/')
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1280,
    })
  })

  it('restores session windows without clearing them during StrictMode mount', async () => {
    window.sessionStorage.setItem(
      'open-windows',
      JSON.stringify([
        { slug: 'restored-window', zIndex: 51, minimized: false, cascadeIndex: 2 },
      ]),
    )

    const { result } = renderHook(() => useWindowManager(), { wrapper: StrictWrapper })

    await waitFor(() => {
      expect(result.current.windows.map((win) => win.rootSlug)).toContain('restored-window')
    })

    expect(JSON.parse(window.sessionStorage.getItem('open-windows') ?? '[]')).toEqual([
      { slug: 'restored-window', zIndex: 51, minimized: false, cascadeIndex: 2 },
    ])
  })
})
