import { userEvent } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { DrawerCloseButton } from '@/components/drawer/close-button'
import { DrawerShell } from '@/components/drawer/shell'
import { DrawerTrigger } from '@/components/drawer/trigger'

describe('drawer behavior', () => {
  it('opens from its trigger, receives keyboard focus, and closes with Escape', async () => {
    const screen = await render(
      <DrawerShell trigger={<DrawerTrigger>Open details</DrawerTrigger>}>
        <h2>Project details</h2>
        <DrawerCloseButton>Close details</DrawerCloseButton>
      </DrawerShell>,
    )
    const dialog = screen.getByRole('dialog')

    await expect.element(dialog).toHaveAttribute('data-state', 'closed')
    await screen.getByRole('button', { name: 'Open details' }).click()
    await expect.element(dialog).toHaveAttribute('data-state', 'open')

    await userEvent.tab()
    await expect.element(screen.getByRole('button', { name: 'Close details' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect.element(dialog).toHaveAttribute('data-state', 'closed')
  })

  it('closes from its visible close action and supports auto-open', async () => {
    const screen = await render(
      <DrawerShell autoOpen>
        <DrawerCloseButton aria-label="Dismiss drawer">Done</DrawerCloseButton>
      </DrawerShell>,
    )
    const dialog = screen.getByRole('dialog')

    await expect.element(dialog).toHaveAttribute('data-state', 'open')
    await screen.getByRole('button', { name: 'Dismiss drawer' }).click()
    await expect.element(dialog).toHaveAttribute('data-state', 'closed')
  })
})
