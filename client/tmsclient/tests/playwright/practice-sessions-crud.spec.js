import { test, expect } from '@playwright/test';

test.describe('SCRUM-80: Transactional CRUD Testing', () => {

  test('TC-80: Complete Practice Sessions Lifecycle (Create, Read, Update, Delete)', async ({ page }) => {
    
    // --- PRE-CONDITION: Login as Admin ---
    await page.goto('http://localhost:5173/login');
    // If your login box says "Email" inside it:
    await page.getByPlaceholder('Email').fill('admin@sliit.lk'); 

    await page.getByPlaceholder('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Navigate to the Practice Sessions tab
    // Adjust this locator based on exactly what the tab/button says on your Admin Dashboard
    await page.getByText('Practice Sessions').click(); 

    // --- 1. CREATE ---
    const uniqueId = Date.now();
    const sessionName = `QA Test ${uniqueId}`;
    await page.locator('select[name="dayOfWeek"]').selectOption('Monday');
    await page.locator('input[name="startTime"]').fill('10:00 AM');
    await page.locator('input[name="endTime"]').fill('12:00 PM');
    await page.locator('input[name="sessionType"]').fill(sessionName); // Uses the unique name!
    
    await page.getByRole('button', { name: 'Add Session' }).click();

    // --- 2. READ ---
    // Look for the exact unique session we just made, and grab the first one just to be safe
    const newSessionRow = page.locator('tr').filter({ hasText: sessionName }).first();
    await expect(newSessionRow).toBeVisible();
    await expect(newSessionRow).toContainText('10:00 AM');

    // --- 3. UPDATE ---
    // Click the Edit button inside that specific row
    await newSessionRow.getByRole('button', { name: 'Edit' }).click();
    
    // Change the End Time using the precise name attribute
    await page.locator('input[name="endTime"]').fill('1:00 PM');
    await page.getByRole('button', { name: 'Update' }).click();
    
    // Change the End Time
    await page.locator('input[name="endTime"]').fill('1:00 PM');
    await page.getByRole('button', { name: 'Update' }).click();

    // Verify the table reflects the new time
    await expect(newSessionRow).toContainText('1:00 PM');

    // --- 4. DELETE ---
    // IMPORTANT: Browsers throw a pop-up confirmation when deleting. 
    // This line tells Playwright to automatically click "OK" on that pop-up.
    page.on('dialog', dialog => dialog.accept());
    
    // Click the Delete button inside our specific row
    await newSessionRow.getByRole('button', { name: 'Delete' }).click();

    // Verify the session has been wiped from the table
    await expect(newSessionRow).not.toBeVisible();
  });

});