import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 900})
        page = await context.new_page()

        print("Loading app...")
        await page.goto("http://localhost:3000/1")
        await page.wait_for_load_state("networkidle")

        # Click more generally in the top-left area to find a device
        print("Clicking device area...")
        await page.mouse.click(100, 100)
        await page.wait_for_timeout(2000)

        os.makedirs("verification/screenshots", exist_ok=True)
        await page.screenshot(path="verification/screenshots/final_check.png")

        # Check for any button that could open a terminal
        buttons = await page.get_by_role("button").all()
        for btn in buttons:
            name = await btn.inner_text()
            if "Open" in name:
                print(f"Found button: {name}")
                await btn.click()
                break

        await page.wait_for_timeout(2000)
        await page.screenshot(path="verification/screenshots/final_terminal.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
