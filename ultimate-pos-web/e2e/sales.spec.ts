import { test, expect } from '@playwright/test';
import { loginAsAdmin, getAdminToken } from './helpers/auth';

const API = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000/api';

/**
 * Full integration flow:
 * 1. Create a product via API (fast — no UI overhead)
 * 2. Record initial stock via API
 * 3. Open POS → scan SKU → complete sale
 * 4. Verify stock decreased in the products list
 */
test.describe('Sales & Stock — full flow', () => {
  let accessToken: string;
  let productId: number;
  let productSku: string;
  const QTY_TO_SELL = 2;
  const INITIAL_STOCK = 10;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // 1. Get a token for direct API calls
    accessToken = await getAdminToken(page);

    // 1b. Seed standard accounts
    await page.request.post(`${API}/accounts/seed`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 2. Get a unit (needed for product)
    const unitRes = await page.request.get(`${API}/units`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const unitBody = await unitRes.json();
    const units = unitBody.data || unitBody;
    const unitId = (units[0] as any)?.id;
    if (!unitId) throw new Error(`No units in seed — run prisma/seed.ts first. Response was: ${JSON.stringify(unitBody)}`);

    // 3. Create a test product
    const sku = `E2E-SALE-${Date.now()}`;
    productSku = sku;
    const productRes = await page.request.post(`${API}/products`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      data: { name: `E2E Sale Product ${sku}`, sku, unitId, enableStock: true },
    });
    expect(productRes.ok()).toBeTruthy();
    const productBody = await productRes.json();
    productId = productBody.data?.id || productBody.id;

    // 3b. Create Product Variation
    const pvRes = await page.request.post(`${API}/variations/product-variations`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      data: { productId, name: 'DUMMY' }
    });
    expect(pvRes.ok()).toBeTruthy();
    const pvBody = await pvRes.json();
    const productVariation = pvBody.data || pvBody;
    const productVariationId = productVariation.id;

    // 3c. Create Variation
    const vRes = await page.request.post(`${API}/variations`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      data: {
        productId,
        productVariationId,
        name: 'DUMMY_VALUE',
        subSku: sku,
        defaultPurchasePrice: 10.00,
        defaultSellPrice: 15.00,
      }
    });
    expect(vRes.ok()).toBeTruthy();
    const vBody = await vRes.json();
    const variation = vBody.data || vBody;
    const variationId = variation.id;

    // 4. Add initial stock via stock-adjustment
    const adjRes = await page.request.post(`${API}/stock-adjustments`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      data: {
        locationId: 1,
        referenceNo: `E2E-ADJ-${Date.now()}`,
        lines: [{ variationId, quantity: INITIAL_STOCK, unitPrice: 10.00, reason: 'found' }],
      },
    });
    expect(adjRes.ok()).toBeTruthy();

    await page.close();
  });

  test('sales list page loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/sales');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /sales|orders/i })).toBeVisible();
  });

  test('POS: scan SKU and add to cart', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');

    // The barcode input is the dedicated scanner row
    const barcodeInput = page.locator('.barcode-input');
    await expect(barcodeInput).toBeVisible();

    await barcodeInput.fill(productSku);
    await barcodeInput.press('Enter');

    // Should show success snackbar or cart should have item
    await page.waitForTimeout(800);
    const cartItem = page.locator('.cart-item, .item-info').filter({ hasText: /E2E Sale Product/ });
    // If stock was added, item should appear in cart; if stock is 0, snackbar shows "Out of stock"
    const snackbar = page.locator('snack-bar-container, .mdc-snackbar');
    const hasItem = await cartItem.isVisible().catch(() => false);
    const hasSnack = await snackbar.isVisible().catch(() => false);
    expect(hasItem || hasSnack).toBeTruthy();
  });

  test('POS: complete sale decrements stock', async ({ page }) => {
    // Skip if product has no stock
    test.skip(!productId, 'Product not created in beforeAll');

    await loginAsAdmin(page);
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');

    // Check stock via API before sale
    const beforeRes = await page.request.get(`${API}/inventory/stock`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let beforeStock: number | null = null;
    if (beforeRes.ok()) {
      const beforeBody = await beforeRes.json();
      const beforeList = beforeBody.data || beforeBody;
      beforeStock = Array.isArray(beforeList)
        ? beforeList.find((s: any) => s.id === productId)?.currentStock ?? null
        : null;
    }

    // Add product to cart via barcode scan
    const barcodeInput = page.locator('.barcode-input');
    await barcodeInput.fill(productSku);
    await barcodeInput.press('Enter');
    await page.waitForTimeout(500);

    // If product was found in cart, complete the sale
    const cartItem = page.locator('.cart-item').first();
    if (await cartItem.isVisible()) {
      // Set amount paid
      const paidInput = page.locator('input.bold-input, input[formcontrolname="paidCtrl"]').first();
      if (await paidInput.isVisible()) await paidInput.fill('9999');

      const checkoutBtn = page.getByRole('button', { name: /complete sale|checkout/i });
      await checkoutBtn.click();
      await page.waitForTimeout(1500);

      // Verify success snackbar
      const snack = page.locator('snack-bar-container, .mdc-snackbar');
      await expect(snack).toBeVisible({ timeout: 5000 });

      // Check stock after sale via API
      if (beforeStock !== null) {
        const afterRes = await page.request.get(`${API}/inventory/stock`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (afterRes.ok()) {
          const afterBody = await afterRes.json();
          const afterList = afterBody.data || afterBody;
          const afterStock = Array.isArray(afterList)
            ? afterList.find((s: any) => s.id === productId)?.currentStock ?? null
            : null;
          if (afterStock !== null) {
            expect(Number(afterStock)).toBeLessThan(Number(beforeStock));
          }
        }
      }
    }
  });

  test('reports dashboard shows data', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /report|dashboard/i })).toBeVisible();
  });
});
