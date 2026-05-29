/**
 * E2E Tests — Velen (Playwright)
 * Run: npx playwright test
 * Docs: https://playwright.dev
 *
 * Setup: npx playwright install chromium
 * Config: playwright.config.js (see bottom of this file for recommended config)
 */

 const { test, expect } = require("@playwright/test");

 const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
 
 // ── Test credentials (use dedicated test accounts, not real ones) ──
 const STUDENT_EMAIL    = process.env.TEST_STUDENT_EMAIL    || "teststudent@velen.ng";
 const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || "TestPass123!";
 const LANDLORD_EMAIL    = process.env.TEST_LANDLORD_EMAIL    || "testlandlord@velen.ng";
 const LANDLORD_PASSWORD = process.env.TEST_LANDLORD_PASSWORD || "TestPass123!";
 
 
 // ════════════════════════════════════════════════════════════
 // 1. LANDING PAGE
 // ════════════════════════════════════════════════════════════
 test.describe("Landing Page", () => {
   test("renders hero section correctly", async ({ page }) => {
     await page.goto(BASE_URL);
     await expect(page.locator("h1")).toContainText("student home");
     await expect(page.getByText("Browse Rooms")).toBeVisible();
     await expect(page.getByText("Find Roommate")).toBeVisible();
   });
 
   test("navbar links are present", async ({ page }) => {
     await page.goto(BASE_URL);
     await expect(page.getByRole("link", { name: "Browse" })).toBeVisible();
     await expect(page.getByRole("link", { name: "Roommates" })).toBeVisible();
   });
 
   test("Browse Rooms button navigates to listings", async ({ page }) => {
     await page.goto(BASE_URL);
     await page.getByText("Browse Rooms").click();
     await expect(page).toHaveURL(/\/listings/);
   });
 
   test("Find Roommate button navigates to roommates page", async ({ page }) => {
     await page.goto(BASE_URL);
     await page.getByText("Find Roommate").click();
     await expect(page).toHaveURL(/\/roommates/);
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 2. AUTH FLOWS
 // ════════════════════════════════════════════════════════════
 test.describe("Authentication", () => {
   test("login page renders correctly", async ({ page }) => {
     await page.goto(`${BASE_URL}/login`);
     await expect(page.getByRole("heading")).toBeVisible();
     await expect(page.locator("input[type='email']")).toBeVisible();
     await expect(page.locator("input[type='password']")).toBeVisible();
   });
 
   test("shows error on invalid credentials", async ({ page }) => {
     await page.goto(`${BASE_URL}/login`);
     await page.fill("input[type='email']", "wrong@email.com");
     await page.fill("input[type='password']", "wrongpassword");
     await page.getByRole("button", { name: /log in/i }).click();
     // Expect some error message to appear
     await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 5000 });
   });
 
   test("successful student login redirects to home", async ({ page }) => {
     await page.goto(`${BASE_URL}/login`);
     await page.fill("input[type='email']", STUDENT_EMAIL);
     await page.fill("input[type='password']", STUDENT_PASSWORD);
     await page.getByRole("button", { name: /log in/i }).click();
     await expect(page).toHaveURL(BASE_URL + "/", { timeout: 8000 });
   });
 
   test("login with returnUrl redirects correctly after auth", async ({ page }) => {
     await page.goto(`${BASE_URL}/login?returnUrl=/saved-listings`);
     await page.fill("input[type='email']", STUDENT_EMAIL);
     await page.fill("input[type='password']", STUDENT_PASSWORD);
     await page.getByRole("button", { name: /log in/i }).click();
     await expect(page).toHaveURL(/\/saved-listings/, { timeout: 8000 });
   });
 
   test("signup page renders both student and landlord role options", async ({ page }) => {
     await page.goto(`${BASE_URL}/signup`);
     await expect(page.getByText(/student/i)).toBeVisible();
     await expect(page.getByText(/landlord|agent/i)).toBeVisible();
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 3. LISTINGS BROWSE
 // ════════════════════════════════════════════════════════════
 test.describe("Browse Listings", () => {
   test("listings page loads and shows listing cards", async ({ page }) => {
     await page.goto(`${BASE_URL}/listings`);
     // Wait for at least one listing card
     await expect(page.locator(".listing-card").first()).toBeVisible({ timeout: 8000 });
   });
 
   test("filter bar is visible", async ({ page }) => {
     await page.goto(`${BASE_URL}/listings`);
     await expect(page.locator(".filter-bar, [class*='filter']").first()).toBeVisible({ timeout: 5000 });
   });
 
   test("clicking a listing card navigates to listing detail", async ({ page }) => {
     await page.goto(`${BASE_URL}/listings`);
     await page.locator(".listing-card").first().click();
     await expect(page).toHaveURL(/\/listings\/.+/);
   });
 
   test("listing detail page shows price and location", async ({ page }) => {
     await page.goto(`${BASE_URL}/listings`);
     await page.locator(".listing-card").first().click();
     await expect(page.getByText(/₦/)).toBeVisible({ timeout: 5000 });
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 4. SAVED LISTINGS — AUTH GATE
 // ════════════════════════════════════════════════════════════
 test.describe("Saved Listings Auth Gate", () => {
   test("redirects to login when not authenticated", async ({ page }) => {
     // Clear any stored session
     await page.context().clearCookies();
     await page.goto(`${BASE_URL}/saved-listings`);
     await expect(page).toHaveURL(/\/login/, { timeout: 6000 });
   });
 
   test("login redirect includes returnUrl for saved listings", async ({ page }) => {
     await page.context().clearCookies();
     await page.goto(`${BASE_URL}/saved-listings`);
     await expect(page).toHaveURL(/returnUrl.*saved/, { timeout: 6000 });
   });
 
   test("authenticated user can access saved listings", async ({ page }) => {
     await page.goto(`${BASE_URL}/login`);
     await page.fill("input[type='email']", STUDENT_EMAIL);
     await page.fill("input[type='password']", STUDENT_PASSWORD);
     await page.getByRole("button", { name: /log in/i }).click();
     await page.goto(`${BASE_URL}/saved-listings`);
     await expect(page).toHaveURL(/\/saved-listings/);
     await expect(page.getByText(/favorite listings|no saved/i)).toBeVisible({ timeout: 6000 });
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 5. ROOMMATES
 // ════════════════════════════════════════════════════════════
 test.describe("Roommates", () => {
   test("roommates page loads", async ({ page }) => {
     await page.goto(`${BASE_URL}/roommates`);
     await expect(page).toHaveURL(/\/roommates/);
     await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
   });
 
   test("post a roommate listing requires auth", async ({ page }) => {
     await page.context().clearCookies();
     await page.goto(`${BASE_URL}/roommates/post`);
     // Should either redirect to login or show an auth prompt
     const url = page.url();
     const hasLoginRedirect = url.includes("/login");
     const hasAuthPrompt = await page.getByText(/log in|sign in/i).isVisible().catch(() => false);
     expect(hasLoginRedirect || hasAuthPrompt).toBe(true);
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 6. LEGAL PAGES
 // ════════════════════════════════════════════════════════════
 test.describe("Legal Pages", () => {
   test("terms page loads and shows content", async ({ page }) => {
     await page.goto(`${BASE_URL}/terms`);
     await expect(page.getByText(/Terms of Service/i)).toBeVisible();
     await expect(page.getByText(/Acceptance/i)).toBeVisible();
   });
 
   test("privacy page loads and shows content", async ({ page }) => {
     await page.goto(`${BASE_URL}/privacy`);
     await expect(page.getByText(/Privacy Policy/i)).toBeVisible();
     await expect(page.getByText(/information we collect/i)).toBeVisible();
   });
 
   test("terms page links to privacy page", async ({ page }) => {
     await page.goto(`${BASE_URL}/terms`);
     await page.getByRole("link", { name: /privacy policy/i }).first().click();
     await expect(page).toHaveURL(/\/privacy/);
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 7. LANDLORD DASHBOARD (authenticated)
 // ════════════════════════════════════════════════════════════
 test.describe("Landlord Dashboard", () => {
   test.beforeEach(async ({ page }) => {
     await page.goto(`${BASE_URL}/login`);
     await page.fill("input[type='email']", LANDLORD_EMAIL);
     await page.fill("input[type='password']", LANDLORD_PASSWORD);
     await page.getByRole("button", { name: /log in/i }).click();
     await page.waitForURL(BASE_URL + "/", { timeout: 8000 });
   });
 
   test("dashboard page loads for landlord", async ({ page }) => {
     await page.goto(`${BASE_URL}/dashboard`);
     await expect(page).toHaveURL(/\/dashboard/);
     await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
   });
 
   test("add listing page is accessible", async ({ page }) => {
     await page.goto(`${BASE_URL}/add-listing`);
     await expect(page.locator("form, [class*='form']").first()).toBeVisible({ timeout: 5000 });
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 8. AGENT PROFILE PAGE
 // ════════════════════════════════════════════════════════════
 test.describe("Agent Profile", () => {
   test("agent profile page renders with valid id param", async ({ page }) => {
     // Navigate to listings first to find a real agent link
     await page.goto(`${BASE_URL}/listings`);
     const agentLink = page.locator("[class*='agent']").first();
     const hasAgent = await agentLink.isVisible().catch(() => false);
     if (hasAgent) {
       await agentLink.click();
       await expect(page).toHaveURL(/\/agent\/.+/);
     } else {
       test.skip();
     }
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 9. NOTIFICATIONS
 // ════════════════════════════════════════════════════════════
 test.describe("Notifications", () => {
   test("notification bell is visible when logged in", async ({ page }) => {
     await page.goto(`${BASE_URL}/login`);
     await page.fill("input[type='email']", STUDENT_EMAIL);
     await page.fill("input[type='password']", STUDENT_PASSWORD);
     await page.getByRole("button", { name: /log in/i }).click();
     await page.waitForURL(BASE_URL + "/", { timeout: 8000 });
     await expect(page.locator("[class*='bell'], [aria-label*='notification']").first()).toBeVisible();
   });
 });
 
 
 // ════════════════════════════════════════════════════════════
 // 10. 404 / ERROR STATES
 // ════════════════════════════════════════════════════════════
 test.describe("Error States", () => {
   test("non-existent listing shows not found state", async ({ page }) => {
     await page.goto(`${BASE_URL}/listings/this-id-does-not-exist-xyz`);
     await expect(page.getByText(/not found|does not exist|unavailable/i)).toBeVisible({ timeout: 6000 });
   });
 
   test("non-existent agent page shows not found state", async ({ page }) => {
     await page.goto(`${BASE_URL}/agent/fake-agent-id-xyz`);
     await expect(page.getByText(/not found|no agent|unavailable/i)).toBeVisible({ timeout: 6000 });
   });
 });