import { test, expect } from "@playwright/test";

test.describe("Footer functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display copyright text", async ({ page }) => {
    await expect(page.locator(".footer h4")).toContainText("All Rights Reserved");
    await expect(page.locator(".footer h4")).toContainText("TestingComp");
  });

  test("should display navigation links", async ({ page }) => {
    await expect(page.locator(".footer").getByRole("link", { name: /about/i })).toBeVisible();
    await expect(page.locator(".footer").getByRole("link", { name: /contact/i })).toBeVisible();
    await expect(page.locator(".footer").getByRole("link", { name: /privacy policy/i })).toBeVisible();
  });

  test("should navigate to About page when About link is clicked", async ({ page }) => {
    await page.locator(".footer").getByRole("link", { name: /about/i }).click();
    
    await page.waitForURL("**/about");

    await expect(page).toHaveTitle("About us - Ecommerce app");
  });

  test("should navigate to Contact page when Contact link is clicked", async ({ page }) => {
    await page.locator(".footer").getByRole("link", { name: /contact/i }).click();
    
    await page.waitForURL("**/contact");
    
    await expect(page.locator("h1")).toContainText("CONTACT US");
  });

  test("should navigate to Privacy Policy page when Privacy Policy link is clicked", async ({ page }) => {
    await page.locator(".footer").getByRole("link", { name: /privacy policy/i }).click();

    await page.waitForURL("**/policy");

    await expect(page).toHaveTitle("Privacy Policy");
  });

  test("footer should be visible on all important pages", async ({ page }) => {
    // Check homepage
    await expect(page.locator(".footer")).toBeVisible();
    
    // Main page types
    const pagesToCheck = [
      // Public pages
      "/contact",
      "/about",
      "/policy",
      "/categories",
      "/cart",
      "/search",
      "/login",
      "/register",
      "/forgot-password",
      
      // User pages - these require authentication
      "/dashboard/user",
      "/dashboard/user/orders",
      "/dashboard/user/profile",
      
      // Admin pages - these require admin authentication
      "/dashboard/admin",
      "/dashboard/admin/create-product",
      "/dashboard/admin/products",
      "/dashboard/admin/create-category",
      "/dashboard/admin/users",
    ];
    
    for (const path of pagesToCheck) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".footer"), `Footer should be visible on ${path}`).toBeVisible();
    }
  });

  test("footer should maintain consistent styling across pages", async ({ page }) => {
    const footerElement = page.locator(".footer");
    const initialPosition = await footerElement.boundingBox();
    
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    
    const contactPagePosition = await footerElement.boundingBox();
    
    expect(contactPagePosition.x).toBeCloseTo(initialPosition.x, 0);
    expect(contactPagePosition.width).toBeCloseTo(initialPosition.width, 0);
  });
});
