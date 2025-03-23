const { test, expect } = require("@playwright/test");

test.describe("Contact Page Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate to contact page", async ({ page }) => {
    // Click on the Contact link in navigation
    await page.click("text=Contact");

    // Wait for navigation to complete
    await page.waitForURL("**/contact");

    // Check for heading
    await expect(page.locator("h1")).toContainText("CONTACT US");
  });

  test("should display contact page elements correctly", async ({ page }) => {
    // Navigate directly to contact page2
    await page.goto("/contact");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Check if heading exists
    await expect(page.locator("h1.text-center")).toBeVisible();
    await expect(page.locator("h1")).toHaveText("CONTACT US");

    // Check if contact image is loaded - using the updated alt text
    const contactImage = page.locator('img[alt="Contact us support team"]');
    await expect(contactImage).toBeVisible();

    // Verify contact information is displayed
    await expect(
      page.locator('a[href="mailto:help@ecommerceapp.com"]')
    ).toBeVisible();
    await expect(page.locator('a[href="tel:0123456789"]')).toBeVisible();
    await expect(page.locator('a[href="tel:18000000000"]')).toBeVisible();
  });

  test("should display properly formatted contact details", async ({
    page,
  }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    // Check email format
    const emailElement = page.locator('a[href="mailto:help@ecommerceapp.com"]');
    await expect(emailElement).toBeVisible();
    const emailText = await emailElement.textContent();
    expect(emailText).toContain("@");

    // Check phone number format
    const phoneElement = page.locator('a[href="tel:0123456789"]');
    await expect(phoneElement).toBeVisible();
    const phoneText = await phoneElement.textContent();
    expect(phoneText).toMatch(/\d{3}-\d{7}/);

    // Check toll-free number
    const tollFreeElement = page.locator('a[href="tel:18000000000"]');
    await expect(tollFreeElement).toBeVisible();
  });

  test("should have responsive design", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    // Test on desktop size (default)
    const contactContainer = page.locator("div.contactus");
    await expect(contactContainer).toBeVisible();

    // Test on mobile size
    await page.setViewportSize({ width: 480, height: 800 });
    await expect(contactContainer).toBeVisible();
  });
});
