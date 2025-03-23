import { test, expect } from '@playwright/test';

test.describe('Authentication Flow UI Tests', () => {
  
  // LOGIN TEST

  test('should log in successfully and navigate to dashboard', async ({ page }) => {
    // make sure the user is registered.
    await page.goto('http://localhost:3000/register');
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('John Doe');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('12345678');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
    await page.getByPlaceholder('Enter Your DOB').fill('2003-01-01');
    await page.getByRole('button', { name: 'REGISTER' }).click();
    
    // Navigate to the login page
    await page.goto('http://localhost:3000/login', {waitUntil: "commit"});
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.waitForSelector('button:has-text("LOGIN")', { state: "visible" });
    await page.click('button:has-text("LOGIN")');

    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('should show error message on invalid login credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('111@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    const errorMessage = page.locator('div[role="status"]');
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 });

    await expect(errorMessage).toHaveText('Something went wrong');
  });

  test('should navigate to Forgot Password page', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('button', { name: 'Forgot Password' }).click();

    await expect(page).toHaveURL('http://localhost:3000/forgot-password');
  });


  // REGISTER TEST

  test('should register successfully if email is not registered', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('John Doe');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('emailNotRegistered@123.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('12345678');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
    await page.getByPlaceholder('Enter Your DOB').fill('2003-01-01');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    expect(page.url()).toBe('http://localhost:3000/register');
  });

  test('should show error message when email is already registered', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('John Doe');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('emailregistered@123.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('12345678');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
    await page.getByPlaceholder('Enter Your DOB').fill('2003-01-01');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // register with the same email gain
    await page.goto('http://localhost:3000/register');
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('John Doe');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('emailregistered@123.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('12345678');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
    await page.getByPlaceholder('Enter Your DOB').fill('2003-01-01');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    const errorToast = page.locator('div[role="status"]');
    await errorToast.waitFor({ state: 'visible', timeout: 5000 });

    await expect(errorToast).toHaveText('Already Registered. Please login');
  });


  // FORGOT PASSWORD TEST

  test('should reset password successfully and navigate to login', async ({ page }) => {
    await page.goto('http://localhost:3000/forgot-password');

    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Answer' }).fill('football');
    await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('newpassword123');
    await page.click('button:text("RESET PASSWORD")');

    expect(page.url()).toBe('http://localhost:3000/forgot-password'); 
  });

  test('should show error message on invalid password reset attempt', async ({ page }) => {
    await page.goto('http://localhost:3000/forgot-password');

    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Enter Your Answer' }).fill('wronganswer');
    await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('newpassword123');
    await page.click('button:text("RESET PASSWORD")');

    const errorMessage = page.locator('div[role="status"]');
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 });

    await expect(errorMessage).toHaveText('Something went wrong');
  });
});
