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
    await page.goto('/products/create');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel(/product name|name/i).first()).toBeVisible();
    await expect(page.getByLabel(/sku/i)).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/products/create');
    await page.waitForLoadState('networkidle');

    // Touch the name input to trigger validation error
    const nameInput = page.getByLabel(/product name|name/i).first();
    await nameInput.focus();
    await nameInput.blur();

    // Expect at minimum one mat-error to appear
    await expect(page.locator('mat-error').first()).toBeVisible();
  });
});
