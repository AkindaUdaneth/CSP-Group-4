import { test, expect } from '@playwright/test';

test.describe('SCRUM-79: Registration Workflow', () => {

  test('TC-79.1: Happy Path - Successful Registration', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    // We use a timestamp to generate a unique email and username every time the test runs!
    const uniqueId = Date.now(); 

    // Fill out the form. 
    // Using generic locators targeting the input fields from top to bottom
    const inputs = page.locator('input');
    await inputs.nth(0).fill(`QA_User_${uniqueId}`); // Username
    await inputs.nth(1).fill(`IT${uniqueId.toString().slice(-4)}`); // Identity Number
    await inputs.nth(2).fill(`qa_${uniqueId}@sliit.lk`); // Email
    await inputs.nth(3).fill('StrongPass123!'); // Password
    await inputs.nth(4).fill('StrongPass123!'); // Confirm Password

    // Click the Sign Up button
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Verify successful routing or success message
    // (Adjust this if your app redirects to /login instead of /dashboard upon signup)
    await expect(page).toHaveURL(/.*dashboard|.*login/);
  });

  test('TC-79.2: Negative Path - Duplicate Email', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    // Trying to use the same email you tested manually earlier
    await page.locator('input').nth(0).fill('DuplicateTester');
    await page.locator('input').nth(1).fill('IT9999');
    await page.locator('input').nth(2).fill('akinda123@sliit.lk'); 
    await page.locator('input').nth(3).fill('StrongPass123!');
    await page.locator('input').nth(4).fill('StrongPass123!');

    await page.getByRole('button', { name: 'Sign Up' }).click();

    // The page should NOT redirect, meaning the URL remains /signup
    await expect(page).toHaveURL('http://localhost:5173/signup');
  });

  test('TC-79.3: Negative Path - Missing Required Fields', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    // We leave the Username (nth(0)) blank on purpose
    await page.locator('input').nth(1).fill('IT8888');
    await page.locator('input').nth(2).fill('missing@sliit.lk');
    await page.locator('input').nth(3).fill('StrongPass123!');
    await page.locator('input').nth(4).fill('StrongPass123!');

    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Verify we are still blocked on the signup page
    await expect(page).toHaveURL('http://localhost:5173/signup');
  });

});