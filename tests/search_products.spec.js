import { test, expect } from "@playwright/test";

import fs from "fs";
import path from "path";

const PRODUCTS = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../config/seedData/products.json"),
    "utf-8"
  )
);
const PRODUCT_TEXTBOOK = PRODUCTS.find((p) => p.name === "Textbook");

test.describe("Product search", () => {
  test("should show products that match keyword", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("searchbox", { name: /search/i }).fill("textbook");
    await page.getByRole("button", { name: /search/i }).click();

    // Should show correct number of products found
    await expect(page.getByText(/found 1/i)).toBeVisible();

    // Should show the correct product's details
    await expect(
      page.getByRole("heading", { name: PRODUCT_TEXTBOOK.name })
    ).toBeVisible();
    await expect(
      page.getByText(`${PRODUCT_TEXTBOOK.description}...`)
    ).toBeVisible();
    await expect(page.getByText(`$ ${PRODUCT_TEXTBOOK.price}`)).toBeVisible();

    // Should show 'More Details' button
    await expect(
      page.getByRole("button", { name: /more details/i })
    ).toBeVisible();

    // Should show 'ADD TO CART' button
    await expect(
      page.getByRole("button", { name: /add to cart/i })
    ).toBeVisible();
  });

  test("should not search products when search term is empty", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("searchbox", { name: /search/i }).fill("  "); // Fill with empty string
    await page.getByRole("button", { name: /search/i }).click();

    // Should not navigate to search page
    await expect(
      page.getByRole("heading", { name: /search results/i })
    ).not.toBeVisible();
  });

  test("should show 'No Products Found' when no products match keyword", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("searchbox", { name: /search/i })
      .fill("thereIsNoSuchProduct");
    await page.getByRole("button", { name: /search/i }).click();

    // Should show 'No Products Found'
    await expect(page.getByText(/no products found/i)).toBeVisible();
  });
});
