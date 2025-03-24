import { test, expect } from '@playwright/test';

test.describe('Category CRUD flow', () => {
  test('should perform create, read, update, and delete operations for categories', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3001/login');
    await page.getByRole('textbox', { name: /email/i }).fill('cs4218@test.com');
    await page.getByRole('textbox', { name: /password/i }).fill('cs4218@test.com');
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to create category
    await page.goto('http://localhost:3001/dashboard/admin/create-category');

    // Submit empty form
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText(/somthing went wrong/i)).toBeVisible();

    // Create duplicate category
    await page.getByPlaceholder('Enter new category').fill('Clothing');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText(/already exists/i)).toBeVisible();

    // Create another category
    await page.getByPlaceholder('Enter new category').fill('Clothing1');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('cell', { name: 'Clothing1' })).toBeVisible();

    // Edit category
    await page.getByRole('button', { name: 'Edit' }).nth(1).click();
    await page.getByRole('dialog').getByPlaceholder('Enter new category').fill('Clothing2');
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('cell', { name: 'Clothing2' })).toBeVisible();

    // Delete category
    await page.getByRole('button', { name: 'Delete' }).nth(1).click();
    await page.getByRole('button', { name: 'Delete' }).nth(1).click(); 
    await expect(page.getByRole('cell', { name: 'Clothing2' })).not.toBeVisible();

    // View categories via nav
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'All Categories' }).click();
    await expect(page.getByTestId('category-list')).toBeVisible();
  });
});
