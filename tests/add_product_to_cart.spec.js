import { test, expect } from "@playwright/test";

import fs from "fs";
import path from "path";

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

const PRODUCT_TEXTBOOK = PRODUCTS.find((p) => p.name === "Textbook");
const PRODUCT_STORYBOOK = PRODUCTS.find((p) => p.name === "Storybook");
const CATEGORIES_BOOK = CATEGORIES.find((c) => c.name === "Book");

const clickAddToCartBtn = async (page, product) => {
  await page
    .locator(".card-body")
    .filter({ hasText: product.name })
    .getByRole("button", { name: /add to cart/i })
    .click();
};
const clickCartLink = async (page) => {
  await page.getByRole("link", { name: /cart/i }).click();
};
const assertProductInCart = async (page, product) => {
  await expect(page.locator(`text=${product.name}`).first()).toBeVisible();
};
const removeProductFromCart = async (page, product) => {
  await page
    .locator(".card")
    .filter({ hasText: product.name })
    .getByRole("button", { name: /remove/i })
    .click();
};

test.describe("Add product to cart", () => {
  test("should add product to cart from home page", async ({ page }) => {
    await page.goto("/");

    await clickAddToCartBtn(page, PRODUCT_TEXTBOOK);

    // Should show toast
    await expect(page.getByText(/item added to cart/i)).toBeVisible();

    // Should show product in cart
    await clickCartLink(page);
    await assertProductInCart(page, PRODUCT_TEXTBOOK);

    await removeProductFromCart(page, PRODUCT_TEXTBOOK);
  });

  test("should add product to cart from category product page", async ({
    page,
  }) => {
    await page.goto(`/category/${CATEGORIES_BOOK.name}`);

    await clickAddToCartBtn(page, PRODUCT_TEXTBOOK);

    // Should show toast
    await expect(page.getByText(/item added to cart/i)).toBeVisible();

    // Should show product in cart
    await clickCartLink(page);
    await assertProductInCart(page, PRODUCT_TEXTBOOK);

    await removeProductFromCart(page, PRODUCT_TEXTBOOK);
  });

  test("should add product to cart from product search page", async ({
    page,
  }) => {
    await page.goto("/search");

    await page.getByRole("searchbox", { name: /search/i }).fill("textbook");
    await page.getByRole("button", { name: /search/i }).click();

    await clickAddToCartBtn(page, PRODUCT_TEXTBOOK);

    // Should show toast
    await expect(page.getByText(/item added to cart/i)).toBeVisible();

    // Should show product in cart
    await clickCartLink(page);
    await assertProductInCart(page, PRODUCT_TEXTBOOK);

    await removeProductFromCart(page, PRODUCT_TEXTBOOK);
  });

  test("should add product to cart from product details page", async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_TEXTBOOK.slug}`);

    await page
      .locator(".product-details")
      .getByRole("button", { name: /add to cart/i })
      .click();

    // Should show toast
    await expect(page.getByText(/item added to cart/i)).toBeVisible();

    // Should show product in cart
    await clickCartLink(page);
    await assertProductInCart(page, PRODUCT_TEXTBOOK);

    await removeProductFromCart(page, PRODUCT_TEXTBOOK);
  });

  test("should add similar product to cart from product details page", async ({
    page,
  }) => {
    await page.goto(`/product/${PRODUCT_TEXTBOOK.slug}`);

    await clickAddToCartBtn(page, PRODUCT_STORYBOOK);

    // Should show toast
    await expect(page.getByText(/item added to cart/i)).toBeVisible();

    // Should show product in cart
    await clickCartLink(page);
    await assertProductInCart(page, PRODUCT_STORYBOOK);

    await removeProductFromCart(page, PRODUCT_STORYBOOK);
  });
});
