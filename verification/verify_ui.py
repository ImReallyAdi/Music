from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Go to Home
    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle")

    page.screenshot(path="verification/home.png")
    print("Home screenshot taken.")

    # 2. Go to Search
    # Use index-based selection for web components
    search_tab = page.locator("md-navigation-tab").nth(1)
    if search_tab.is_visible():
        search_tab.click()
    else:
        print("Search tab not found.")

    page.wait_for_timeout(1000)
    page.screenshot(path="verification/search.png")
    print("Search screenshot taken.")

    # 3. Type a URL in Search to see Import UI
    search_field = page.locator("md-outlined-text-field")
    if search_field.count() > 0:
        # Focusing the field often requires clicking the internal input or just clicking the component
        search_field.first.click()
        page.keyboard.type("https://example.com/audio.mp3")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/search_import.png")
        print("Search Import UI screenshot taken.")
    else:
        print("Search field not found.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
