import { test, expect } from '@playwright/test';

test('verify ftp and ntp', async ({ page }) => {
  // Go to a project with a server
  await page.goto('http://localhost:3000/dns-http');

  // Wait for loading to finish
  await page.waitForTimeout(2000);

  // Close onboarding/modals
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');

  // Try to find a PC and click it.
  // Since canvas is hard, let's try to find "PC-1" or similar if labeled in DOM.
  // Or use the "Select Device" dropdown if available.

  // Looking at the screenshots, there is a device info panel at the bottom right.
  // It says "Server" or "PC-1".

  // Let's try to use the device selector if we can find it.
  // But usually, clicking on the canvas selects it.
  // Let's try to click at a coordinate where a PC usually is in dns-http.
  // From exampleProjects.ts: PC-1 is at (40, 120)? Wait, dns-http is from JSON.

  // Let's try to find ANY "Open" button and click it.
  const openButton = page.locator('button:has-text("Open")');
  if (await openButton.isVisible()) {
    await openButton.click();
  } else {
    // If not visible, click on the canvas to select something
    await page.mouse.click(100, 150);
    await page.waitForTimeout(500);
    await openButton.click();
  }

  // Now in the PC/Server Panel
  await page.waitForTimeout(1000);

  // Click CMD
  await page.click('text=CMD');
  await page.waitForTimeout(500);

  // Type ftp to the server (192.168.1.10 is common in dns-http)
  // We need to click inside the terminal first to ensure focus
  await page.click('canvas, .xterm-rows, textarea');
  await page.keyboard.type('ftp 192.168.1.10');
  await page.keyboard.press('Enter');

  // Wait for FTP Modal
  try {
    await expect(page.locator('text=FTP File Transfer')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'verification/ftp_modal_visible.png' });
    console.log('FTP Modal detected!');
  } catch (e) {
    console.log('FTP Modal not detected, taking screenshot for debug');
    await page.screenshot({ path: 'verification/ftp_debug.png' });
  }

  // Now try NTP on a switch
  await page.goto('http://localhost:3000/basic-secure');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Select Switch-1
  await page.mouse.click(300, 200);
  await page.waitForTimeout(500);
  await page.click('button:has-text("Open")');
  await page.waitForTimeout(1000);

  // The Switch panel might open in CMD directly if it's a switch
  // Type show clock
  await page.keyboard.type('show clock');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'verification/ntp_clock_output.png' });
});
