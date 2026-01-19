from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_ui(page: Page):
    print("Navigating to home (Dark Mode)...")
    page.goto("http://localhost:3000")

    # Wait for app to load
    print("Waiting for app to load...")
    page.wait_for_selector("text=Fresh picks", timeout=10000)

    # Take screenshot of Home
    print("Taking screenshot of Home...")
    time.sleep(2) # Wait for animations
    page.screenshot(path="verification/home_dark.png")

    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Force dark color scheme
        context = browser.new_context(viewport={"width": 1280, "height": 800}, color_scheme='dark')
        page = context.new_page()
        try:
            verify_ui(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
