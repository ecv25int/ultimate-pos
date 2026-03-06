import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

const PRODUCT_NAME = `E2E-Product-${Date.now()}`;
const PRODUCT_SKU = `E2E-${Date.now()}`;

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('products list page loads', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    // Expect a heading or table/grid
    await expect(page.getByRole('heading', { name: /product/i })).toBeVisible();
  });

  test('can navigate to create product form', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add product|new product|create/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page).toHaveURL(/\/products\/(new|create|form)/);
  });

  test('product form has required fields', async ({ page }) => {
    await page.goto('/products/new');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel(/product name|name/i).first()).toBeVisible();
    await expect(page.getByLabel(/sku/i)).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/products/new');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /save|create|submit/i }).click();

    // Expect at minimum one mat-error to appear
    await expect(page.locator('mat-error').first()).toBeVisible();
  });

  test('password strength meter appears on register page', async ({ page }) => {
    await page.goto('/auth/register');
    // Strength meter only shows once password has content
    const passwordInput = page.getByLabel(/^password/i);
    await passwordInput.fill('abc');
    await expect(page.locator('app-password-strength')).toBeVisible();
    await expect(page.locator('.strength-label')).toBeVisible();
  });
});
