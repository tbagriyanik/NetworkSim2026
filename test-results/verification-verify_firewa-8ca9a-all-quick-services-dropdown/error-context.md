# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verification/verify_firewall_ui.spec.ts >> verify firewall quick services dropdown
- Location: verification/verify_firewall_ui.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('canvas, svg') to be visible
    - locator resolved to 2 elements. Proceeding with the first one: <svg width="12" height="12" fill="none" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">…</svg>
    2 × locator resolved to 36 elements. Proceeding with the first one: <svg width="24" height="24" fill="none" stroke-width="2" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" class="lucide lucide-undo2 lucide-undo-2 w-4 h-4 opacity-30">…</svg>
    53 × locator resolved to 40 elements. Proceeding with the first one: <svg width="24" height="24" fill="none" stroke-width="2" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" class="lucide lucide-undo2 lucide-undo-2 w-4 h-4 opacity-30">…</svg>

```

# Page snapshot

```yaml
- generic:
  - link:
    - /url: "#main-content"
    - text: Skip to main content
  - generic:
    - generic:
      - generic:
        - generic:
          - banner:
            - generic:
              - generic:
                - button:
                  - generic:
                    - img
                  - generic:
                    - heading [level=2]: Network Simulator
                    - paragraph: Develop Your Networking Skills
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - button:
                          - img
                        - button:
                          - img
                        - button:
                          - img
                        - button:
                          - img
                    - button:
                      - img
                    - button:
                      - img
                      - text: EN
                    - button:
                      - img
                    - button:
                      - img
          - main:
            - generic:
              - generic:
                - generic:
                  - button:
                    - img
                  - button:
                    - generic:
                      - img
                      - generic: Select Device
                    - img
                  - generic:
                    - button:
                      - img
                    - button:
                      - img
                    - button:
                      - img
                    - button:
                      - img
                    - button:
                      - img
                    - button:
                      - img
                  - generic:
                    - button:
                      - img
                    - button:
                      - img
                    - button:
                      - img
                  - button:
                    - img
                  - button:
                    - img
                  - button:
                    - img
                  - button:
                    - img
                  - button [disabled]:
                    - img
                  - button [disabled]:
                    - img
                  - button:
                    - img
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - application:
                          - img:
                            - generic:
                              - generic: 3000 × 2000
                        - generic:
                          - button: −
                          - button: 100%
                          - button: +
                          - button: Reset
          - contentinfo:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic: "Saved: 7:08:09 AM"
                  - generic:
                    - generic: 🕸️
                    - generic:
                      - text: (Shift) TABTAB for next deviceCtrl+SSave|No devices
                      - generic:
                        - generic: LeftMB
                        - text: :Pan
                        - generic: ·
                        - generic: MidMB
                        - text: :Box
                        - generic: ·
                        - generic: RightMB
                        - text: :Menu
                        - generic: ·
                        - generic: Wheel
                        - text: :Zoom
    - list
  - list
  - alert
  - dialog "🎓 Welcome" [ref=e2]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "🎓 Welcome" [level=2] [ref=e10]
        - generic [ref=e11]: 1 / 9
      - paragraph [ref=e12]: Welcome to Network Simulator! This quick tour will show you the essential features. Configure connections, manage devices, and develop your networking skills.
    - generic [ref=e13]:
      - button "Skip" [active] [ref=e14] [cursor=pointer]
      - generic [ref=e15]:
        - button "Back" [disabled]
        - button "Next" [ref=e16] [cursor=pointer]
    - button "Close" [ref=e17] [cursor=pointer]:
      - img [ref=e18]
      - generic [ref=e21]: Close
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('verify firewall quick services dropdown', async ({ page }) => {
  4  |   await page.goto('http://localhost:3000/?id=firewall-basic');
  5  |
  6  |   // Wait for the canvas to be ready
> 7  |   await page.waitForSelector('canvas, svg');
     |              ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  8  |   await page.waitForTimeout(3000);
  9  |
  10 |   // Try to find the device. In our simulator, devices are often div or g with text.
  11 |   // We'll try to click by text but with a more robust way.
  12 |   const device = page.locator('div, span, g').filter({ hasText: /^FW-1$/ }).first();
  13 |   await device.click({ force: true });
  14 |
  15 |   // Wait for the panel to open
  16 |   // If it's a firewall, it should show "Konsol" or "Console"
  17 |   await page.waitForSelector('button[role="tab"]', { timeout: 10000 });
  18 |
  19 |   // Click the "Quick Settings" or "Hızlı Ayarlar" tab
  20 |   // Try both TR and EN
  21 |   const settingsTab = page.locator('button[role="tab"]').filter({ hasText: /Hızlı Ayarlar|Quick Settings/ });
  22 |   await settingsTab.click();
  23 |
  24 |   // Verify the "Quick Services" dropdown exists
  25 |   // It's the one after "Hızlı Servisler" label
  26 |   const dropdownTrigger = page.getByPlaceholder(/Servis seçin...|Select service.../);
  27 |   await expect(dropdownTrigger).toBeVisible();
  28 |
  29 |   // Click the dropdown to see items
  30 |   await dropdownTrigger.click();
  31 |
  32 |   // Verify some service items exist
  33 |   await expect(page.locator('div[role="option"]').filter({ hasText: 'HTTP (80)' })).toBeVisible();
  34 |   await expect(page.locator('div[role="option"]').filter({ hasText: 'DENY ALL' })).toBeVisible();
  35 |
  36 |   // Select a service
  37 |   await page.locator('div[role="option"]').filter({ hasText: 'HTTP (80)' }).click();
  38 |
  39 |   // Verify a new rule was added to the list
  40 |   await expect(page.locator('div').filter({ hasText: 'HTTP' }).first()).toBeVisible();
  41 |
  42 |   // Take a screenshot
  43 |   await page.screenshot({ path: 'verification/screenshots/firewall_dropdown_fixed.png' });
  44 | });
  45 |
```