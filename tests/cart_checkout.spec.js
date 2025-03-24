import { test, expect } from '@playwright/test';

const user = {
  email: 'cs4218@test.com',
  password: 'cs4218@test.com',
};

// Helper for login
async function login(page) {
  await page.goto('http://localhost:3001/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(user.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
}

test.describe('Cart Page Integration', () => {
  test('should show empty cart message', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3001/cart');
    await expect(page.locator('h1')).toContainText('Your Cart Is Empty');
  });

  test('should add a product to cart and navigate to cart page', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByRole('button', { name: 'ADD TO CART' }).nth(1).click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByText('Price :')).toBeVisible();
  });

  test('should fail payment with empty card fields', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Paying with Card' }).click();
    await page.getByRole('button', { name: 'Make Payment' }).click();
    await expect(page.getByText('Please check your information')).toBeVisible();
  });

  test('should complete payment with valid card info and verify order in list', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Paying with Card' }).click();

    await page.frameLocator('iframe[name="braintree-hosted-field-number"]').getByRole('textbox').fill('4000 0070 2000 0003');
    await page.frameLocator('iframe[name="braintree-hosted-field-cvv"]').getByRole('textbox').fill('123');
    await page.frameLocator('iframe[name="braintree-hosted-field-expirationDate"]').getByRole('textbox').fill('0830');

    await page.getByRole('button', { name: 'Make Payment' }).click();

    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible();

    // Verify the new order row in the table
    await expect(page.getByRole('cell', { name: '2', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2', exact: true })).toBeVisible();
  });

  test('should add multiple items to cart and display correct total', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3001');
    const priceElements = await page.locator('h1,h2,h3,h4,h5,h6').filter({ hasText: /^\$\d/ }).allTextContents();

    const total = priceElements.slice(0, 4).reduce((sum, text) => {
      const num = parseFloat(text.replace('$', ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    console.log(`Total (first 4): $${total.toFixed(2)}`);
    await page.getByRole('button', { name: 'ADD TO CART' }).nth(0).click();
    await page.getByRole('button', { name: 'ADD TO CART' }).nth(1).click();
    await page.getByRole('button', { name: 'ADD TO CART' }).nth(2).click();
    await page.getByRole('button', { name: 'ADD TO CART' }).nth(3).click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByText('You Have 4 items in your cart')).toBeVisible();

    const totalText = await page.getByRole('heading', { name: /Total : \$/ }).textContent();
    expect(totalText).toContain(`Total : $${total.toFixed(2)} `);
  });

  test('should allow user to remove items from cart', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'ADD TO CART' }).nth(1).click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Remove' }).first().click();
    await expect(page.getByText('Your Cart is Empty')).toBeVisible();
  });
});
