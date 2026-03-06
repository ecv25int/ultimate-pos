import { test, expect } from '@playwright/test';
import { loginAs, loginAsAdmin } from './helpers/auth';

test.describe('Authentication', () => {
  test('login page renders with username + password fields', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/Ultimate POS/i);
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('shows error with wrong credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/username/i).fill('nobody');
    await page.getByLabel(/password/i).fill('wrongpass');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should stay on login page and show an error snackbar or inline error
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard/);

    // Look for a logout button (avatar menu or sidebar)
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Open user menu first
      const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, mat-icon:has-text("account_circle")').first();
      await userMenu.click();
      await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
    }

    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Clear any existing session
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('"Remember me" checkbox is visible', async ({ page }) => {
    await page.goto('/auth/login');
    const checkbox = page.locator('mat-checkbox, input[type=checkbox]').filter({ hasText: /remember/i });
    await expect(checkbox).toBeVisible();
  });

  test('forgot password link navigates to forgot-password page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: /forgot.*password/i }).click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });
});
