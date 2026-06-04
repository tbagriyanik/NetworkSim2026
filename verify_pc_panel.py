
import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        # Go to the local dev server
        await page.goto('http://localhost:3000')

        # Wait for the onboarding dialog or click it away if it exists
        await page.wait_for_timeout(2000)
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)

        # Click the PC icon in the toolbar to add a PC
        await page.click('button[aria-label="Add PC"]')

        # Wait for the PC to appear and click it
        # We'll use the coordinate from the previous script which seemed to work or try to find it.
        await page.mouse.click(640, 360)

        # Wait for the side panel to open
        await page.wait_for_selector('button:has-text("Open")', timeout=5000)

        # Click Open
        await page.click('button:has-text("Open")')

        # Wait for PC Panel to open
        await page.wait_for_selector('text=Desktop', timeout=5000)

        # Take a screenshot of the panel
        await page.screenshot(path='/home/jules/verification/screenshots/pc_panel_open.png')

        # Try to hover over the search button to show the tooltip
        # The search button is in the ModernPanel header.
        search_button = page.locator('button[aria-label="Search content"]')
        if await search_button.count() > 0:
            await search_button.hover()
            await page.wait_for_timeout(1000) # Wait for tooltip to appear
            await page.screenshot(path='/home/jules/verification/screenshots/pc_panel_search_tooltip.png')

        # Switch to Terminal tab
        await page.click('text=Console')
        await page.wait_for_timeout(500)

        # Open terminal settings
        settings_button = page.locator('button[aria-label="Terminal Settings"]')
        if await settings_button.count() > 0:
            await settings_button.click()
            await page.wait_for_timeout(500)

            # Hover over Clear button
            clear_button = page.locator('button[aria-label="Clear Terminal"]')
            if await clear_button.count() > 0:
                await clear_button.hover()
                await page.wait_for_timeout(1000)
                await page.screenshot(path='/home/jules/verification/screenshots/pc_panel_clear_tooltip.png')

        await browser.close()

if __name__ == "__main__":
    os.makedirs('/home/jules/verification/screenshots', exist_ok=True)
    asyncio.run(run())
