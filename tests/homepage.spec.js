import { test, expect } from "@playwright/test";

import fs from "fs";
import path from "path";

// Load product and category data from seed files
const PRODUCTS = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../config/seedData/products.json"),
    "utf-8"
  )
);
const CATEGORIES = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../config/seedData/categories.json"),
    "utf-8"
  )
);

// Product constants for easier reference
const PRODUCT_TEXTBOOK = PRODUCTS.find((p) => p.name === "Textbook");
const PRODUCT_LAPTOP = PRODUCTS.find((p) => p.name === "Laptop");
const PRODUCT_TSHIRT = PRODUCTS.find((p) => p.name === "NUS T-shirt");

// Helper functions
const getProductCardByName = (page, name) => 
  page.locator(".card-body").filter({ hasText: name });

const clickAddToCartBtn = async (page, productName) => {
  await getProductCardByName(page, productName)
    .getByRole("button", { name: /add to cart/i })
    .click();
};

const clickMoreDetailsBtn = async (page, productName) => {
  await getProductCardByName(page, productName)
    .getByRole("button", { name: /more details/i })
    .click();
};

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    // Go to homepage before each test
    await page.goto("/");
  });

  test("should load homepage and display products", async ({ page }) => {
    // Check if page title is visible
    await expect(page.getByRole("heading", { name: /all products/i })).toBeVisible();
    
    // Check if the featured products are visible
    await expect(page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_LAPTOP.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_TSHIRT.name })).toBeVisible();
    
    // Check if filters section is visible - using a more general selector
    await expect(page.getByText(/filter by category/i)).toBeVisible();
    await expect(page.getByText(/filter by price/i)).toBeVisible();
  });

  test("should navigate to product details page", async ({ page }) => {
    // Click on more details button for a product
    await clickMoreDetailsBtn(page, PRODUCT_TEXTBOOK.name);
    
    // Verify we're on the product details page
    // Updated to match the actual text format "Name : Textbook"
    await expect(page.getByTestId("product-name")).toContainText(PRODUCT_TEXTBOOK.name);
    await expect(page.getByText(/product details/i)).toBeVisible();
  });

  test("should add product to cart from homepage", async ({ page }) => {
    // Add a product to cart
    await clickAddToCartBtn(page, PRODUCT_TEXTBOOK.name);
    
    // Should show toast notification
    await expect(page.getByText(/item added to cart/i)).toBeVisible();
    
    // Go to cart page
    await page.getByRole("link", { name: /cart/i }).click();
    
    // Verify product is in cart
    await expect(page.locator(`text=${PRODUCT_TEXTBOOK.name}`).first()).toBeVisible();
    
    // Clean up: remove product from cart
    await page
      .locator(".card")
      .filter({ hasText: PRODUCT_TEXTBOOK.name })
      .getByRole("button", { name: /remove/i })
      .click();
  });

  test("should search for products", async ({ page }) => {
    // Type in search box
    await page.getByPlaceholder(/search/i).fill("textbook");
    await page.getByRole("button", { name: /search/i }).click();
    
    // Verify we're on search results page
    await expect(page.getByRole("heading", { name: /search results/i })).toBeVisible();
    
    // Verify the product is found
    await expect(page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_LAPTOP.name })).not.toBeVisible();
  });

  test("should navigate to categories", async ({ page }) => {
    // Fix: Use the Categories link in the navbar first
    await page.getByRole("link", { name: /categories/i }).click();
    
    // Get the "Books" category
    const bookCategory = CATEGORIES.find(c => c.name === "Book");
    
    // Then click on the specific category from the categories page
    await page.getByRole("link", { name: bookCategory.name }).click();
    
    // Verify we're on the category page
    await expect(page.getByText(`Category - ${bookCategory.name}`)).toBeVisible();
    
    // Verify only books are shown
    await expect(page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_LAPTOP.name })).not.toBeVisible();
  });

  test("should filter products by price range", async ({ page }) => {
    // Select price range $0 to $19.99 (should show T-shirt only)
    await page.getByRole("radio", { name: /\$0 to 19\.99/i }).check();
    
    // Verify filtering works
    await expect(page.getByRole("heading", { name: PRODUCT_TSHIRT.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_LAPTOP.name })).not.toBeVisible();
    
    // Reset filters
    await page.getByRole("button", { name: /reset filters/i }).click();
    
    // Verify all products are shown again
    await expect(page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_LAPTOP.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_TSHIRT.name })).toBeVisible();
  });

  test("should filter products by category", async ({ page }) => {
    // Check the Electronics category checkbox
    await page.getByRole("checkbox", { name: "Electronics" }).check();
    
    // Verify only electronics are shown
    await expect(page.getByRole("heading", { name: PRODUCT_LAPTOP.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_TSHIRT.name })).not.toBeVisible();
    
    // Check additional category (Book)
    await page.getByRole("checkbox", { name: "Book" }).check();
    
    // Verify books and electronics are shown
    await expect(page.getByRole("heading", { name: PRODUCT_LAPTOP.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_TSHIRT.name })).not.toBeVisible();
  });

  test("should combine category and price filters", async ({ page }) => {
    // Select Book category
    await page.getByRole("checkbox", { name: "Book" }).check();
    
    // Select price range $60 to $79.99 (should show Textbook only)
    await page.getByRole("radio", { name: /\$60 to 79\.99/i }).check();
    
    // Verify only Textbook is shown
    await expect(page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_LAPTOP.name })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: PRODUCT_TSHIRT.name })).not.toBeVisible();
  });

  test("should navigate through pagination if available", async ({ page }) => {
    // Look for pagination controls (might not be visible if not enough products)
    const paginationControl = page.getByRole("link", { name: "2" });
    
    // Skip test if pagination is not available
    if (await paginationControl.count() === 0) {
      test.skip("Pagination not available with current product count");
    } else {
      // Click on page 2
      await paginationControl.click();
      
      // Verify page has changed (URL should include page=2)
      await expect(page).toHaveURL(/.*page=2.*/);
    }
  });
});
