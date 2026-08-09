import type { ManagedWindow, WindowManager } from '@/hooks/useWindowManager'
import { useWindowManager } from '@/hooks/useWindowManager'
import { promiseCache, seedPromise } from '@/lib/window-promise-cache'
import { describe, expect, it, vi } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'

import { ShortcutRegistryProvider } from '@/components/shortcut/registry-context'
import { Taskbar } from '@/components/taskbar'
import { ContentErrorBoundary } from '@/components/window/content-error-boundary'
import { WindowManagerContextProvider } from '@/components/window/manager-context'
import {
  SetWindowOptions,
  SetWindowTitle,
  SetWindowToolbar,
  useWindowTitle,
  WindowTitleProvider,
} from '@/components/window/title-context'

function WindowManagerHarness() {
  const manager = useWindowManager()
  const about = manager.windows.find((win) => win.rootSlug === 'about')
  return (
    <div>
      <button type="button" onClick={() => manager.open('about')}>Open about</button>
      <button type="button" onClick={() => manager.openSystem('display-options')}>Open display</button>
      <button type="button" onClick={() => manager.navigateInWindow('about', 'work')}>Visit work</button>
      <button type="button" onClick={() => manager.backInWindow('about')}>Back</button>
      <button type="button" onClick={() => manager.forwardInWindow('about')}>Forward</button>
      <button type="button" onClick={() => manager.minimize('about')}>Begin minimize</button>
      <button type="button" onClick={() => manager.actualMinimize('about')}>Finish minimize</button>
      <button type="button" onClick={() => manager.focus('about')}>Focus about</button>
      <button type="button" onClick={() => manager.close('about')}>Close about</button>
      <output aria-label="Window count">{manager.windows.length}</output>
      <output aria-label="About state">
        {about
          ? `${about.slug}|${about.historyIndex}|${about.minimized}|${about.pendingMinimize}`
          : 'closed'}
      </output>
    </div>
  )
}

describe('window manager behavior', () => {
  it('coordinates content, system, history, focus, minimize, persistence, and close state', async () => {
    seedPromise('about', null)
    seedPromise('work', null)
    const screen = await render(<WindowManagerHarness />)

    await screen.getByRole('button', { name: 'Open about' }).click()
    await expect.element(screen.getByLabelText('About state')).toHaveTextContent('about|0|false|false')
    await expect.poll(() => window.location.pathname).toBe('/about')

    await screen.getByRole('button', { name: 'Open display' }).click()
    await expect.element(screen.getByLabelText('Window count')).toHaveTextContent('2')
    await screen.getByRole('button', { name: 'Visit work' }).click()
    await expect.element(screen.getByLabelText('About state')).toHaveTextContent('work|1|false|false')
    await screen.getByRole('button', { name: 'Back' }).click()
    await expect.element(screen.getByLabelText('About state')).toHaveTextContent('about|0|false|false')
    await screen.getByRole('button', { name: 'Forward' }).click()
    await expect.element(screen.getByLabelText('About state')).toHaveTextContent('work|1|false|false')

    await screen.getByRole('button', { name: 'Begin minimize' }).click()
    await expect.element(screen.getByLabelText('About state')).toHaveTextContent('work|1|false|true')
    await screen.getByRole('button', { name: 'Finish minimize' }).click()
    await expect.element(screen.getByLabelText('About state')).toHaveTextContent('work|1|true|false')
    await screen.getByRole('button', { name: 'Focus about' }).click()
    await expect.element(screen.getByLabelText('About state')).toHaveTextContent('work|1|false|false')

    await expect.poll(() => sessionStorage.getItem('open-windows')).toContain('about')
    await screen.getByRole('button', { name: 'Close about' }).click()
    await expect.element(screen.getByLabelText('About state')).toHaveTextContent('closed')
    expect(promiseCache.has('about')).toBe(false)
    expect(promiseCache.has('work')).toBe(false)
  })

  it('uses taskbar buttons to minimize visible windows and focus minimized windows', async () => {
    const focus = vi.fn()
    const minimize = vi.fn()
    const windows: ManagedWindow[] = [
      {
        id: 'content:about',
        kind: 'content',
        rootSlug: 'about',
        slug: 'about',
        historyStack: ['about'],
        historyIndex: 0,
        zIndex: 52,
        minimized: false,
        cascadeIndex: 0,
        pendingMinimize: false,
      },
      {
        id: 'system:display-options',
        kind: 'system',
        systemKey: 'display-options',
        rootSlug: 'system:display-options',
        slug: 'system:display-options',
        historyStack: [],
        historyIndex: 0,
        zIndex: 190,
        minimized: true,
        cascadeIndex: 1,
        pendingMinimize: false,
      },
    ]
    const manager = { windows, focus, minimize } as unknown as WindowManager
    const screen = await render(
      <WindowManagerContextProvider manager={manager}>
        <ShortcutRegistryProvider
          shortcuts={[
            {
              slug: 'about',
              icon: 'ri-user-fill',
              name: 'About me',
              title: 'About me',
              color: '#4A9EFF',
              category: 'windows',
            },
          ]}
        >
          <Taskbar />
        </ShortcutRegistryProvider>
      </WindowManagerContextProvider>,
    )

    await screen.getByRole('button', { name: 'About me' }).click()
    await screen.getByRole('button', { name: 'Display Options' }).click()
    expect(minimize).toHaveBeenCalledWith('about')
    expect(focus).toHaveBeenCalledWith('system:display-options')
  })
})

function TitleState() {
  const state = useWindowTitle()
  return (
    <output aria-label="Title state">
      {[
        state.title,
        state.disableMinimize,
        state.resizable,
        state.expandable,
        state.displaySearch,
        state.displayViewToggle,
        state.defaultView,
        state.displayHistory,
      ].join('|')}
    </output>
  )
}

describe('window page contracts', () => {
  it('lets content declare its title, chrome, and toolbar capabilities', async () => {
    const screen = await render(
      <WindowTitleProvider>
        <SetWindowTitle title="Case study" />
        <SetWindowOptions disableMinimize resizable={false} expandable />
        <SetWindowToolbar displaySearch displayViewToggle defaultView="table" displayHistory />
        <TitleState />
      </WindowTitleProvider>,
    )

    await expect.element(screen.getByLabelText('Title state')).toHaveTextContent(
      'Case study|true|false|true|true|true|table|true',
    )
  })
})

describe('content error recovery', () => {
  it('shows a recoverable failure and retries the original content', async () => {
    let shouldThrow = true
    const retry = vi.fn(() => {
      shouldThrow = false
    })
    const expectedError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function Content() {
      if (shouldThrow) throw new Error('controlled render failure')
      return <p>Recovered content</p>
    }

    const screen = await render(
      <ContentErrorBoundary onRetry={retry}>
        <Content />
      </ContentErrorBoundary>,
    )
    await expect.element(screen.getByText('An error has occurred.')).toBeVisible()
    await screen.getByRole('button', { name: 'Retry' }).click()

    await expect.element(screen.getByText('Recovered content')).toBeVisible()
    expect(retry).toHaveBeenCalledOnce()
    expect(expectedError).toHaveBeenCalled()
    expectedError.mockRestore()
    await cleanup()
  })
})
