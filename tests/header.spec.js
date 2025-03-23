import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const CATEGORIES = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../config/seedData/categories.json"),
    "utf-8"
  )
);

test.describe("Header functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display brand logo and name", async ({ page }) => {
    await expect(page.getByRole("link", { name: /virtual vault/i })).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /categories/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /cart/i })).toBeVisible();
  });

  test("should display login and register links when not logged in", async ({ page }) => {
    // Check if login and register links are visible when not logged in
    // logging out first since playwright config has login by default
    await page.getByRole("button", { name: /cs4218 admin/i }).click();
    await page.getByRole("link", { name: /logout/i }).click();
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("should show categories dropdown when clicked", async ({ page }) => {
    await page.getByRole("link", { name: /categories/i }).click();
    
    await expect(page.getByRole("link", { name: /all categories/i })).toBeVisible();

    const firstCategory = CATEGORIES[0];
    await expect(page.getByRole("link", { name: firstCategory.name })).toBeVisible();
  });

  test("should navigate to category page when category is clicked", async ({ page }) => {
    await page.getByRole("link", { name: /categories/i }).click();
    
    const targetCategory = CATEGORIES[0];
    await page.getByRole("link", { name: targetCategory.name }).click();
    
    await expect(page.getByText(`Category - ${targetCategory.name}`)).toBeVisible();
  });

  test("should navigate to home page when clicking on brand", async ({ page }) => {

    await page.getByRole("link", { name: /categories/i }).click();
    await page.getByRole("link", { name: /all categories/i }).click();
    
    await page.getByRole("link", { name: /virtual vault/i }).click();
    
    await expect(page.getByRole("heading", { name: /all products/i })).toBeVisible();
  });

  test("should show cart badge with count 0 when cart is empty", async ({ page }) => {
    await expect(page.locator(".ant-badge-count").filter({ hasText: "0" })).toBeVisible();
  });

  test.describe("Authenticated user header", () => {
    test("should display user dropdown with name when logged in", async ({ page }) => {
      await expect(page.getByRole("button", { name: /cs4218 admin/i })).toBeVisible();
    });

    test("should show dashboard and logout options in user dropdown", async ({ page }) => {
      await page.getByRole("button", { name: /cs4218 admin/i }).click();
      
      await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /logout/i })).toBeVisible();
    });

    test("should logout user when logout is clicked", async ({ page }) => {
      await page.getByRole("button", { name: /cs4218 admin/i }).click();
      
      await page.getByRole("link", { name: /logout/i }).click();

      await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
      
      await expect(page.getByText(/logout successfully/i)).toBeVisible();
    });
  });

  test("should update cart badge when adding product to cart", async ({ page }) => {
    await expect(page.locator(".ant-badge-count").filter({ hasText: "0" })).toBeVisible();

    await page.getByRole("button", { name: /add to cart/i }).first().click();
    
    await expect(page.getByText(/item added to cart/i)).toBeVisible();
    
    await expect(page.locator(".ant-badge-count").filter({ hasText: "1" })).toBeVisible();
    
    await page.getByRole("link", { name: /cart/i }).click();
    await page.getByRole("button", { name: /remove/i }).click();
  });
});
