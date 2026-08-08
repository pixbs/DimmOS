import { expect, test } from './test'

import { installClientState } from './support'

test('mobile startup uses the configured sheet and shortcut navigation', async ({ page }) => {
  await installClientState(page, { suppressStartup: false })
  await page.goto('/')

  const welcome = page.getByRole('dialog', { name: 'Mobile Welcome' })
  await expect(welcome).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Desktop Welcome' })).toBeHidden()
  await expect(welcome.getByText('Mobile ready')).toBeVisible()

  const box = await welcome.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + 24)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + Math.max(220, box!.height / 3))
  await page.mouse.up()
  await expect(welcome).toBeHidden()

  await page.getByRole('link', { name: 'Workspace' }).click()
  await expect(page).toHaveURL(/\/e2e-workspace$/)
  const drawer = page.getByTestId('page-drawer')
  await expect(drawer).toHaveAttribute('data-state', 'open')
  await expect(drawer.getByText('Workspace content rendered from Payload.')).toBeVisible()
  await expect(drawer.getByRole('searchbox', { name: 'Search' })).toBeHidden()
  await expect(drawer.getByRole('button', { name: 'Table view' })).toBeHidden()
})

test('mobile navigation resolves content without leaving a route preloader behind', async ({ page }) => {
  await installClientState(page)
  await page.goto('/e2e-workspace')

  const drawer = page.getByTestId('page-drawer')
  await expect(drawer.getByRole('link', { name: /Alpha Project/ })).toBeVisible()

  await drawer.getByRole('link', { name: /Alpha Project/ }).click()

  await expect(page).toHaveURL(/\/e2e-alpha$/)
  const articleDrawer = page.getByTestId('page-drawer')
  await expect(articleDrawer.getByRole('heading', { name: 'Alpha delivery' })).toBeVisible()
  await expect(articleDrawer.getByText('The team validated each stage with users and production data.')).toBeVisible()
  await expect(page.getByRole('status', { name: 'Loading' })).toBeHidden()
})
