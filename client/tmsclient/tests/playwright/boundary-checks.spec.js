import { test, expect } from '@playwright/test';

test.describe('SCRUM-82: Data Boundary & Stress Testing', () => {

  test('TC-82.1 & 82.2: Registration Boundaries', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    // TC-82.2: Verify empty submission is blocked
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/.*signup/); // Should not redirect

    // TC-82.1: String Overflow (60+ characters)
    const longName = 'A'.repeat(65);
    const inputs = page.locator('input');
    await inputs.nth(0).fill(longName);
    await inputs.nth(1).fill('IT12345');
    await inputs.nth(2).fill(`test_${Date.now()}@sliit.lk`);
    await inputs.nth(3).fill('StrongPass123!');
    await inputs.nth(4).fill('StrongPass123!');
    
    await page.getByRole('button', { name: 'Sign Up' }).click();
    // Currently, this succeeds based on your manual test
    await expect(page).not.toHaveURL(/.*signup/); 
  });

  test('TC-82.3: Practice Session Logical Time Boundary', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:5173/login');
    await page.getByPlaceholder('Email').fill('admin1@sliit.lk'); 
    await page.getByPlaceholder('Password', { exact: true }).fill('adminpass');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.locator('.tab-button', { hasText: 'Practice Sessions' }).click();

    // Fill form with invalid logic (Start 5PM, End 1PM)
    await page.locator('select[name="dayOfWeek"]').selectOption('Friday');
    await page.locator('input[name="startTime"]').fill('5:00 PM');
    await page.locator('input[name="endTime"]').fill('1:00 PM');
    await page.locator('input[name="sessionType"]').fill('Boundary Test');
    
    await page.getByRole('button', { name: 'Add Session' }).click();

    // THIS ASSERTION WILL FAIL - proving the bug exists
    // We expect an error message, but the app currently shows success
    const errorBox = page.locator('.error-message');
    await expect(errorBox).toBeVisible({ timeout: 2000 });
  });

});