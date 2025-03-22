import { test, expect } from "@playwright/test";

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test("test", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByPlaceholder("Enter Your Email ").fill("test@test.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("123456");
  await page.getByRole("button", { name: "LOGIN" }).click();
});
