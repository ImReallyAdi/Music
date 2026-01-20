from playwright.sync_api import Page, expect, sync_playwright

def test_home_render(page: Page):
    # Navigate to the app
    page.goto("http://localhost:3000/")

    # Wait for the "Fresh Picks" headline to be visible
    # Using get_by_role to avoid ambiguity
    fresh_picks = page.get_by_role("heading", name="Fresh Picks")
    expect(fresh_picks).to_be_visible(timeout=10000)

    # Check for "Discovery Mix"
    discovery = page.get_by_text("Discovery Mix")
    expect(discovery).to_be_visible()

    # Check for "Play All" button (using new Button component)
    play_all = page.get_by_role("button", name="Play All")
    expect(play_all).to_be_visible()

    # Take a screenshot
    page.screenshot(path="verification/home_screenshot.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_home_render(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
            page.screenshot(path="verification/error_screenshot.png")
        finally:
            browser.close()
