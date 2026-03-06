import { Page } from '@playwright/test';

const API = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000/api';

/**
 * Login via the Angular login form.
 * Keeps cookies/localStorage persistent within the test.
 */
export async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForSelector('form');

  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
    timeout: 10_000,
  });
}

/** Login as the default admin seeded by prisma/seed.ts */
export async function loginAsAdmin(page: Page) {
  await loginAs(page, 'admin', 'admin123');
}

/** Get an API access token directly (faster for tests that don't test login UI) */
export async function getAdminToken(page: Page): Promise<string> {
  const res = await page.request.post(`${API}/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  });
  const body = await res.json();
  return body.accessToken as string;
}
