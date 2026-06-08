import { test, expect } from '@playwright/test';

test('verify firewall quick services dropdown', async ({ page }) => {
  await page.goto('http://localhost:3000/?id=firewall-basic');

  // Wait for the canvas to be ready
  await page.waitForSelector('canvas, svg');
  await page.waitForTimeout(3000);

  // Try to find the device. In our simulator, devices are often div or g with text.
  // We'll try to click by text but with a more robust way.
  const device = page.locator('div, span, g').filter({ hasText: /^FW-1$/ }).first();
  await device.click({ force: true });

  // Wait for the panel to open
  // If it's a firewall, it should show "Konsol" or "Console"
  await page.waitForSelector('button[role="tab"]', { timeout: 10000 });

  // Click the "Quick Settings" or "Hızlı Ayarlar" tab
  // Try both TR and EN
  const settingsTab = page.locator('button[role="tab"]').filter({ hasText: /Hızlı Ayarlar|Quick Settings/ });
  await settingsTab.click();

  // Verify the "Quick Services" dropdown exists
  // It's the one after "Hızlı Servisler" label
  const dropdownTrigger = page.getByPlaceholder(/Servis seçin...|Select service.../);
  await expect(dropdownTrigger).toBeVisible();

  // Click the dropdown to see items
  await dropdownTrigger.click();

  // Verify some service items exist
  await expect(page.locator('div[role="option"]').filter({ hasText: 'HTTP (80)' })).toBeVisible();
  await expect(page.locator('div[role="option"]').filter({ hasText: 'DENY ALL' })).toBeVisible();

  // Select a service
  await page.locator('div[role="option"]').filter({ hasText: 'HTTP (80)' }).click();

  // Verify a new rule was added to the list
  await expect(page.locator('div').filter({ hasText: 'HTTP' }).first()).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: 'verification/screenshots/firewall_dropdown_fixed.png' });
});
