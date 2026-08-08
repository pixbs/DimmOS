import { expect, test } from './test'

import { installClientState, readWindowGeometry } from './support'

test('desktop startup opens the configured content once per session', async ({ page }) => {
  await installClientState(page, { suppressStartup: false })
  await page.goto('/')

  const welcome = page.getByRole('dialog', { name: 'Desktop Welcome' })
  await expect(welcome).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Mobile Welcome' })).toBeHidden()
  await expect(welcome.getByText('Desktop ready')).toBeVisible()

  await welcome.getByRole('button', { name: 'Close' }).click()
  await expect(welcome).toBeHidden()
  await page.reload()
  await expect(welcome).toBeHidden()
})

test('managed windows preserve focus, geometry, taskbar state, and session state', async ({
  page,
}) => {
  await installClientState(page)
  await page.goto('/')

  await page.getByRole('link', { name: 'Workspace' }).click()
  let workspace = page.getByRole('dialog', { name: 'Core Workspace' })
  await expect(workspace).toBeVisible()
  await expect(page).toHaveURL(/\/e2e-workspace$/)
  await expect
    .poll(() =>
      workspace.evaluate((element) => {
        const style = getComputedStyle(element)
        return (
          Number(style.opacity) > 0.999 &&
          (style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)')
        )
      }),
    )
    .toBe(true)

  const title = workspace.getByText('Core Workspace', { exact: true })
  const titleBar = title.locator('..')
  const titleBox = await titleBar.boundingBox()
  expect(titleBox).not.toBeNull()
  await page.mouse.move(titleBox!.x + titleBox!.width / 2, titleBox!.y + titleBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    titleBox!.x + titleBox!.width / 2 + 96,
    titleBox!.y + titleBox!.height / 2 + 64,
  )
  await page.mouse.up()
  await expect
    .poll(() => readWindowGeometry(page, 'secondary:e2e-workspace'))
    .toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
    })

  const initialBox = await workspace.boundingBox()
  expect(initialBox).not.toBeNull()
  await workspace.getByRole('separator', { name: 'Resize window width' }).press('ArrowRight')
  await expect
    .poll(async () => (await workspace.boundingBox())?.width)
    .toBeGreaterThan(initialBox!.width)

  await workspace.getByRole('button', { name: 'Expand to full screen' }).click()
  await expect(workspace.getByRole('button', { name: 'Restore window' })).toBeVisible()
  await expect.poll(async () => (await workspace.boundingBox())?.width).toBeGreaterThan(1200)
  await workspace.getByRole('button', { name: 'Restore window' }).click()

  await workspace.getByRole('link', { name: 'Open notes' }).click()
  const notes = page.getByRole('dialog', { name: 'Reference Notes' })
  await expect(notes).toBeVisible()
  await expect(page).toHaveURL(/\/e2e-notes$/)

  const workspaceBox = await workspace.boundingBox()
  expect(workspaceBox).not.toBeNull()
  await page.mouse.click(
    workspaceBox!.x + workspaceBox!.width - 8,
    workspaceBox!.y + workspaceBox!.height / 2,
  )
  await expect(page).toHaveURL(/\/e2e-workspace$/)

  await workspace.getByRole('button', { name: 'Minimize' }).click()
  await expect(workspace).toBeHidden()
  const workspaceTask = page.getByRole('button', { name: 'Workspace' })
  await expect(workspaceTask).toHaveAttribute('data-taskbar-minimized', 'true')
  await workspaceTask.click()
  workspace = page.getByRole('dialog', { name: 'Core Workspace' })
  await expect(workspace).toBeVisible()

  await notes.getByRole('button', { name: 'Close' }).click()
  await expect(notes).toBeHidden()
  const savedGeometry = await readWindowGeometry(page, 'secondary:e2e-workspace')
  expect(savedGeometry).toMatchObject({
    w: expect.any(Number),
    x: expect.any(Number),
    y: expect.any(Number),
  })
  await expect
    .poll(() =>
      page.evaluate(() => {
        const stored = JSON.parse(sessionStorage.getItem('open-windows') ?? '[]') as Array<{
          slug: string
        }>
        return stored.map((entry) => entry.slug)
      }),
    )
    .toEqual(['e2e-workspace'])

  await page.goto('/')
  workspace = page.getByRole('dialog', { name: 'Core Workspace' })
  await expect(workspace).toBeVisible()
  await expect
    .poll(() => readWindowGeometry(page, 'secondary:e2e-workspace'))
    .toEqual(savedGeometry)

  await workspace.getByRole('button', { name: 'Close' }).click()
  await expect(workspace).toBeHidden()
  await expect(page).toHaveURL(/\/$/)
})

test('toolbar journeys filter Works, switch views, and navigate within one window', async ({
  page,
}) => {
  await installClientState(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Workspace' }).click()

  let workspace = page.getByRole('dialog', { name: 'Core Workspace' })
  const search = workspace.getByRole('searchbox', { name: 'Search' })
  await search.fill('Beta')
  await expect(workspace.getByRole('button', { name: /Beta Project/ })).toBeVisible()
  await expect(workspace.getByRole('button', { name: /Alpha Project/ })).toBeHidden()
  await search.clear()

  const tableView = workspace.getByRole('button', { name: 'Table view' })
  await tableView.click()
  await expect(tableView).toHaveAttribute('aria-pressed', 'true')
  await expect(workspace.getByRole('columnheader', { name: 'Year' })).toBeVisible()

  await workspace.getByRole('button', { name: /Alpha Project/ }).click()
  const article = page.getByRole('dialog', { name: 'Alpha Project' })
  await expect(article).toBeVisible()
  await expect(page).toHaveURL(/\/e2e-workspace$/)
  await expect(article.getByRole('heading', { name: 'Alpha delivery' })).toBeVisible()
  await expect(article.getByText('Make complex work understandable.')).toBeVisible()
  await expect(article.getByText('Faster delivery')).toBeVisible()
  await expect(article.getByRole('heading', { name: 'Measured approach' })).toBeVisible()
  await expect(article.getByRole('heading', { name: 'Selected outcome' })).toBeVisible()

  await article.getByRole('button', { name: 'Go back' }).click()
  workspace = page.getByRole('dialog', { name: 'Core Workspace' })
  await expect(workspace).toBeVisible()
  await expect(workspace.getByRole('button', { name: 'Go forward' })).toBeEnabled()
  await workspace.getByRole('button', { name: 'Go forward' }).click()
  await expect(page.getByRole('dialog', { name: 'Alpha Project' })).toBeVisible()
})

test('context menus and display controls update the real cursor preference', async ({ page }) => {
  await installClientState(page, { cursor: 'website' })
  await page.goto('/')

  const workspaceShortcut = page.getByRole('link', { name: 'Workspace' })
  const cursor = page.locator('[data-dimm-custom-cursor]')
  const hasFinePointer = await page.evaluate(
    () => matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches,
  )
  const readCursorState = () =>
    cursor.evaluateAll((elements) => ({
      count: elements.length,
      kind: elements[0]?.getAttribute('data-cursor-kind') ?? null,
    }))
  const initialCursorState = new Map([
    [true, { count: 1, kind: 'idle' }],
    [false, { count: 0, kind: null }],
  ]).get(hasFinePointer)
  const expectedCursorState = new Map([
    [true, { count: 1, kind: 'window' }],
    [false, { count: 0, kind: null }],
  ]).get(hasFinePointer)
  await expect.poll(readCursorState).toEqual(initialCursorState)
  await page.mouse.move(0, 0)
  await workspaceShortcut.hover()
  await expect.poll(readCursorState).toEqual(expectedCursorState)

  await workspaceShortcut.click({ button: 'right' })
  const shortcutMenu = page.getByRole('menu', { name: 'Shortcut menu' })
  await expect(shortcutMenu).toBeVisible()
  await expect(
    shortcutMenu.getByRole('menuitem', { name: 'Open in new DimmOS window' }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(shortcutMenu).toBeHidden()

  await page.getByRole('main').click({ button: 'right', position: { x: 900, y: 500 } })
  const wallpaperMenu = page.getByRole('menu', { name: 'Wallpaper menu' })
  await wallpaperMenu.getByRole('menuitem', { name: 'Display options' }).click()

  const displayOptions = page.getByRole('dialog', { name: 'Display Options' })
  const cursorSwitch = displayOptions.getByRole('switch', { name: 'Use website cursor' })
  await expect(cursorSwitch).toBeChecked()
  await cursorSwitch.click()
  await expect(cursorSwitch).not.toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-dimm-cursor', 'system')
  await expect(cursor).toHaveCount(0)
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('display-options:v1') ?? '{}')))
    .toEqual({ cursorMode: 'system' })
})
