import { expect, test } from '@playwright/test'

test('shows hello world heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()
})
