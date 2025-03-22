import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth.json");

// https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email ").fill("cs4218@test.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("/");

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
