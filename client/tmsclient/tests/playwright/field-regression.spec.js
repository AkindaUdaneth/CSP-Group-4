import { test, expect } from '@playwright/test';

test('Field Level Regression: Practice Session Form', async ({ page }) => {
  // Login and navigate
  await page.goto('http://localhost:5173/login');
  await page.getByPlaceholder('Email').fill('admin1@sliit.lk'); 
  await page.getByPlaceholder('Password', { exact: true }).fill('adminpass');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.locator('.tab-button', { hasText: 'Practice Sessions' }).click();

  // Regression: Verify all 4 main inputs exist and have correct attributes
  await expect(page.locator('select[name="dayOfWeek"]')).toBeVisible();
  await expect(page.locator('input[name="startTime"]')).toHaveAttribute('placeholder', 'e.g. 3:00 PM');
  await expect(page.locator('input[name="endTime"]')).toHaveAttribute('placeholder', 'e.g. 6:30 PM');
  await expect(page.locator('input[name="sessionType"]')).toHaveAttribute('placeholder', 'e.g. Team Practice');

  // Regression: Verify 'Add Session' button is primary and visible
  const addBtn = page.getByRole('button', { name: 'Add Session' });
  await expect(addBtn).toBeVisible();
  await expect(addBtn).toHaveClass(/approve-btn/); // Ensures CSS hasn't broken
});