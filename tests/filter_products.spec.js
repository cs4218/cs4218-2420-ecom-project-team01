import { test, expect } from "@playwright/test";

const PRODUCTS = {
  TEXTBOOK: "Textbook",
  LAPTOP: "Laptop",
  TSHIRT: "NUS T-shirt",
};

const CATEGORIES = {
  ELECTRONICS: "Electronics",
  BOOK: "Book",
  CLOTHING: "Clothing",
};

const PRICE_RANGE = {
  ANY: "Any",
  "0_to_19.99": "$0 to 19.99",
  "20_to_39.99": "$20 to 39.99",
  "40_to_59.99": "$40 to 59.99",
  "60_to_79.99": "$60 to 79.99",
  "80_to_99.99": "$80 to 99.99",
  "100_or_more": "$100 or more",
};

const getProductByName = (page, name) => page.getByRole("heading", { name });
const selectCheckbox = (page, name) =>
  page.getByRole("checkbox", { name }).check();
const selectRadio = (page, name) => page.getByRole("radio", { name }).check();

test.describe("Product filter", () => {
  test("should show all products when using default filters (no categories checked, any price range)", async ({
    page,
  }) => {
    await page.goto("/");

    // "Any" price range should be selected by default
    await expect(
      page.getByRole("radio", { name: PRICE_RANGE.ANY })
    ).toBeChecked();

    // No filters selected. Should show all products
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).toBeVisible();
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).toBeVisible();
  });

  test("should filter products by category when category filter(s) are checked", async ({
    page,
  }) => {
    await page.goto("/");

    await selectCheckbox(page, CATEGORIES.BOOK);

    // Should only show books
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).toBeVisible();
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).not.toBeVisible();

    await selectCheckbox(page, CATEGORIES.ELECTRONICS);

    // Should only show books and electronics
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).toBeVisible();
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).toBeVisible();

    await selectCheckbox(page, CATEGORIES.CLOTHING);

    // Should only show books, electronics and clothing (show all products when all categories are checked)
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).toBeVisible();
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).toBeVisible();
  });

  test("should filter products by price range when price radio is checked", async ({
    page,
  }) => {
    await page.goto("/");

    await selectRadio(page, PRICE_RANGE["0_to_19.99"]);

    // Should only show products costing < $20 (t-shirt only)
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).toBeVisible();

    await selectRadio(page, PRICE_RANGE["20_to_39.99"]);

    // Should only show products costing between $20 to $39.99 (no products)
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).not.toBeVisible();

    await selectRadio(page, PRICE_RANGE["60_to_79.99"]);

    // Should only show products costing between $60 to $79.99 (textbook only)
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).toBeVisible();

    await selectRadio(page, PRICE_RANGE["100_or_more"]);

    // Should only show products costing at least $100 (laptop only)
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).not.toBeVisible();
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).toBeVisible();
  });

  test("clicking reset filters should reset filters and show all products", async ({
    page,
  }) => {
    await page.goto("/");

    await selectCheckbox(page, CATEGORIES.BOOK);
    await selectRadio(page, PRICE_RANGE["0_to_19.99"]);

    await page.getByRole("button", { name: "RESET FILTERS" }).click();

    // "Any" price range should be selected
    await expect(
      page.getByRole("radio", { name: PRICE_RANGE.ANY })
    ).toBeChecked();

    // No categories should be checked
    await expect(
      page.getByRole("checkbox", { name: CATEGORIES.BOOK })
    ).not.toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: CATEGORIES.ELECTRONICS })
    ).not.toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: CATEGORIES.CLOTHING })
    ).not.toBeChecked();

    // Should show all products
    await expect(getProductByName(page, PRODUCTS.TEXTBOOK)).toBeVisible();
    await expect(getProductByName(page, PRODUCTS.LAPTOP)).toBeVisible();
    await expect(getProductByName(page, PRODUCTS.TSHIRT)).toBeVisible();
  });
});
