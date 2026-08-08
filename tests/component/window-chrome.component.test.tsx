import { userEvent } from 'vitest/browser'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ResizeHandles } from '@/components/window/ResizeHandles'
import { WindowTitleBar } from '@/components/window/title-bar'
import { WindowToolbar } from '@/components/window/WindowToolbar'
import {
  WindowToolbarProvider,
  useWindowToolbar,
} from '@/components/window/window-toolbar-context'

function ToolbarState() {
  const { searchQuery, viewMode } = useWindowToolbar()
  return <output aria-label="Toolbar state">{`${searchQuery}|${viewMode}`}</output>
}

describe('window title bar', () => {
  it('exposes enabled window actions and keeps disabled actions inert', async () => {
    const close = vi.fn()
    const minimize = vi.fn()
    const expand = vi.fn()
    const dragStart = vi.fn()
    const screen = await render(
      <WindowTitleBar
        title="Portfolio window"
        onClose={close}
        onMinimize={minimize}
        onExpand={expand}
        onPointerDown={dragStart}
        expandable
        disableMinimize
      />,
    )

    await screen.getByRole('button', { name: 'Close' }).click()
    await screen.getByRole('button', { name: 'Expand to full screen' }).click()

    expect(close).toHaveBeenCalledOnce()
    expect(expand).toHaveBeenCalledOnce()
    await expect.element(screen.getByRole('button', { name: 'Minimize' })).toBeDisabled()
    expect(minimize).not.toHaveBeenCalled()

    const title = await screen.getByText('Portfolio window').element()
    title.parentElement!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(dragStart).toHaveBeenCalledOnce()
  })

  it('switches the expansion action to restore when already expanded', async () => {
    const screen = await render(
      <WindowTitleBar
        title="Expanded"
        onClose={() => {}}
        onExpand={() => {}}
        onPointerDown={() => {}}
        expandable
        expanded
      />,
    )

    await expect.element(screen.getByRole('button', { name: 'Restore window' })).toBeEnabled()
  })
})

describe('window toolbar', () => {
  it('updates search and view state through user input', async () => {
    const back = vi.fn()
    const forward = vi.fn()
    const screen = await render(
      <WindowToolbarProvider
        behavior={{
          displaySearch: true,
          displayViewToggle: true,
          defaultView: 'grid',
          displayHistory: true,
        }}
        canGoBack
        canGoForward={false}
        onBack={back}
        onForward={forward}
        onNavigate={() => {}}
      >
        <WindowToolbar />
        <ToolbarState />
      </WindowToolbarProvider>,
    )

    const search = screen.getByRole('searchbox', { name: 'Search' })
    await search.fill('branding')
    await expect.element(screen.getByLabelText('Toolbar state')).toHaveTextContent('branding|grid')

    await screen.getByRole('button', { name: 'Table view' }).click()
    await expect.element(screen.getByRole('button', { name: 'Table view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect.element(screen.getByLabelText('Toolbar state')).toHaveTextContent('branding|table')

    await screen.getByRole('button', { name: 'Go back' }).click()
    expect(back).toHaveBeenCalledOnce()
    await expect.element(screen.getByRole('button', { name: 'Go forward' })).toBeDisabled()
    expect(forward).not.toHaveBeenCalled()
  })

  it('renders no toolbar when every capability is disabled', async () => {
    const screen = await render(
      <WindowToolbarProvider
        behavior={{
          displaySearch: false,
          displayViewToggle: false,
          defaultView: 'grid',
          displayHistory: false,
        }}
        canGoBack={false}
        canGoForward={false}
        onBack={() => {}}
        onForward={() => {}}
        onNavigate={() => {}}
      >
        <WindowToolbar />
        <p>Window content</p>
      </WindowToolbarProvider>,
    )

    await expect.element(screen.getByText('Window content')).toBeVisible()
    await expect.element(screen.getByRole('toolbar')).not.toBeInTheDocument()
  })
})

function ResizablePanel({ onResizeEnd }: { onResizeEnd: (width: number, height: number) => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={panelRef}
      aria-label="Resizable panel"
      style={{
        height: 'var(--win-h, 300px)',
        left: 0,
        position: 'fixed',
        top: 0,
        width: 'var(--win-w, 400px)',
      }}
    >
      <ResizeHandles panelRef={panelRef} onResizeEnd={onResizeEnd} />
    </div>
  )
}

describe('accessible resize handles', () => {
  it('resizes in keyboard increments and reports the committed size', async () => {
    const resized = vi.fn()
    const screen = await render(<ResizablePanel onResizeEnd={resized} />)
    const widthHandle = screen.getByRole('separator', { name: 'Resize window width' })

    await userEvent.tab()
    await expect.element(widthHandle).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.poll(() => resized.mock.calls.at(-1)).toEqual([416, 300])
    await expect.element(widthHandle).toHaveAttribute('aria-valuenow', '33')
  })
})
