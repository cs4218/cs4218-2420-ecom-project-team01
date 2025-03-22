import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.locator('body').click();
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.getByRole('button', { name: 'cs4218@test.com' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.locator('.go2534082608').click();
  await page.locator('div').filter({ hasText: /^somthing went wrong in input form$/ }).nth(2).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('category 2');
  await page.getByRole('textbox', { name: 'Enter new category' }).press('Enter');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('cell', { name: 'category 2' }).click();
  await page.getByRole('cell', { name: 'Edit Delete' }).nth(2).click();
  await page.getByRole('button', { name: 'Edit' }).nth(2).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('category 4');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
});