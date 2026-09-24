# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journey.spec.ts >> 9. Full participant journey (end-to-end mock) >> 9.1 complete journey: register → pay → create team → dashboard
- Location: e2e\journey.spec.ts:445:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Create Your Account')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Create Your Account') with timeout 10000ms
  - waiting for getByText('Create Your Account')

```

```yaml
- complementary:
  - link "Innovators Arena logo Innovators Arena 2.0 36-Hour Hackathon":
    - /url: /
    - img "IA"
    - paragraph: Innovators Arena 2.0
    - paragraph: 36-Hour Hackathon
  - text: T
  - paragraph: Test User
  - paragraph: journey-1789883845982@test.com
  - navigation "Dashboard navigation":
    - link "Dashboard":
      - /url: /dashboard
    - link "Profile":
      - /url: /dashboard/profile
    - link "My Team":
      - /url: /dashboard/team
    - link "Problem Statements":
      - /url: /dashboard/problem-statements
    - link "Submission":
      - /url: /dashboard/submission
    - link "Announcements":
      - /url: /dashboard/announcements
  - button "Sign Out"
- main:
  - paragraph: Dashboard
  - heading "Welcome back, Test!" [level=1]
  - paragraph: Innovators Arena 2.0 · National-Level 36-Hour Hackathon · Kanchipuram · First Week of January 2027
  - link "Profile 100% Complete":
    - /url: /dashboard/profile
    - paragraph: Profile
    - paragraph: 100%
    - paragraph: Complete
  - link "Team IA26-NLEJH Joined":
    - /url: /dashboard/team
    - paragraph: Team
    - paragraph: IA26-NLEJH
    - paragraph: Joined
  - link "Payment ₹199 Payment Required":
    - /url: /dashboard/team
    - paragraph: Payment
    - paragraph: ₹199
    - paragraph: Payment Required
  - link "Submission Locked Complete steps first":
    - /url: /dashboard/submission
    - paragraph: Submission
    - paragraph: Locked
    - paragraph: Complete steps first
  - heading "Quick Actions" [level=2]
  - link "My Team":
    - /url: /dashboard/team
  - link "Problem Statements":
    - /url: /dashboard/problem-statements
  - link "Submission":
    - /url: /dashboard/submission
  - link "Profile":
    - /url: /dashboard/profile
  - link "Announcements":
    - /url: /dashboard/announcements
  - link "Guidelines":
    - /url: /#guidelines
  - heading "Your Progress" [level=2]
  - text: Create Account Complete Profile Create / Join Team 4 Complete Team Active 5 Complete Payment 6 Confirm Team 7 Submit Project
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | // ─── Helper: wipe localStorage between tests ─────────────────────────────────
  4   | async function clearStorage(page: Page) {
  5   |   await page.goto("/");
  6   |   await page.evaluate(() => localStorage.clear());
  7   | }
  8   | 
  9   | async function loginAs(page: Page, email: string) {
  10  |   await page.goto("/login");
  11  |   await page.getByLabel("Email Address").fill(email);
  12  |   await page.locator('input[type="password"]').fill("demo-pass");
  13  |   await page.getByRole("button", { name: "Sign In" }).click();
  14  |   await page.waitForURL(/\/dashboard/);
  15  | }
  16  | 
  17  | async function doRegister(page: Page, email: string) {
  18  |   await page.goto("/register");
> 19  |   await expect(page.getByText("Create Your Account")).toBeVisible({ timeout: 10000 });
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  20  |   // Step 1
  21  |   await page.getByLabel("Full Name").fill("Test User");
  22  |   await page.getByLabel("Email Address").fill(email);
  23  |   await page.locator('input[type="password"]').first().fill("Password123");
  24  |   await page.locator('input[type="password"]').nth(1).fill("Password123");
  25  |   await page.getByRole("button", { name: "Continue" }).click();
  26  |   // Step 2
  27  |   await page.waitForSelector("text=Personal Details");
  28  |   await page.getByLabel("Mobile Number").fill("9876543210");
  29  |   await page.getByLabel("City").fill("Chennai");
  30  |   await page.locator("select").first().selectOption("Tamil Nadu");
  31  |   await page.getByRole("button", { name: "Continue" }).click();
  32  |   // Step 3
  33  |   await page.waitForSelector("text=Academic Information");
  34  |   await page.getByLabel("College / Institution").fill("Demo College");
  35  |   await page.getByLabel("Course / Programme").fill("B.Tech CS");
  36  |   await page.locator("select").selectOption("3rd Year");
  37  |   await page.getByRole("button", { name: "Continue" }).click();
  38  |   // Step 4
  39  |   await page.waitForSelector("text=Review & Agree");
  40  |   await page.locator('input[type="checkbox"]').first().check();
  41  |   await page.getByRole("button", { name: "Create Account" }).click();
  42  |   await page.waitForURL(/\/dashboard/);
  43  | }
  44  | 
  45  | // ─── 1. PUBLIC PAGES ─────────────────────────────────────────────────────────
  46  | test.describe("1. Public pages", () => {
  47  |   test("1.1 homepage loads", async ({ page }) => {
  48  |     await page.goto("/");
  49  |     await expect(page).toHaveTitle(/Innovators Arena 2\.0/);
  50  |     await expect(page.locator("h1")).toContainText("Build. Solve. Innovate.");
  51  |     await expect(page.getByRole("link", { name: "Register Now" }).first()).toBeVisible();
  52  |     
  53  |     // IA WB Image verification
  54  |     await expect(page.locator('img[alt="Innovators Arena Hero"]')).toBeVisible();
  55  |   });
  56  | 
  57  |   test("1.2 header navigation links work", async ({ page }) => {
  58  |     await page.goto("/");
  59  |     await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  60  |     for (const label of ["About", "Timeline", "FAQ", "Contact"]) {
  61  |       await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
  62  |     }
  63  |   });
  64  | 
  65  |   test("1.3 about section", async ({ page }) => {
  66  |     await page.goto("/#about");
  67  |     await expect(page.locator("h2").filter({ hasText: "What is Innovators Arena 2.0?" }).first()).toBeVisible();
  68  |   });
  69  | 
  70  |   test("1.4 problem statements page loads", async ({ page }) => {
  71  |     await page.goto("/problem-statements");
  72  |     await expect(page.locator("h1")).toContainText("Problem Statements");
  73  |     await expect(page.getByText(/Problem Statement/i).first()).toBeVisible();
  74  |   });
  75  | 
  76  |   test("1.5 search filters problem statements", async ({ page }) => {
  77  |     await page.goto("/problem-statements");
  78  |     await page.getByPlaceholder(/Search by title/i).fill("AI");
  79  |     await expect(page.locator("table tbody tr").first()).toBeVisible();
  80  |   });
  81  | 
  82  |   test("1.6 clear search shows all results again", async ({ page }) => {
  83  |     await page.goto("/problem-statements");
  84  |     await page.getByPlaceholder(/Search by title/i).fill("xyzzy-no-match");
  85  |     await expect(page.getByText(/No problem statements match/i)).toBeVisible();
  86  |     await page.getByPlaceholder(/Search by title/i).clear();
  87  |     await expect(page.locator("table tbody tr").nth(5)).toBeVisible();
  88  |   });
  89  | 
  90  |   test("1.7 problem statement detail page", async ({ page }) => {
  91  |     await page.goto("/problem-statements/IA26001");
  92  |     await expect(page.locator("h1")).toContainText("AI-Based Adaptive Learning Platform for Rural Students");
  93  |     await expect(page.getByText("IA26001").first()).toBeVisible();
  94  |   });
  95  | 
  96  |   test("1.8 unknown problem statement shows not-found state", async ({ page }) => {
  97  |     await page.goto("/problem-statements/PS999");
  98  |     await expect(page.getByText("Problem Statement Not Found")).toBeVisible();
  99  |   });
  100 | 
  101 |   test("1.9 timeline section", async ({ page }) => {
  102 |     await page.goto("/timeline");
  103 |     await expect(page.locator("h1")).toContainText(/Timeline/i);
  104 |   });
  105 | 
  106 |   test("1.10 guidelines section", async ({ page }) => {
  107 |     await page.goto("/#guidelines");
  108 |     await expect(page.locator("h2").filter({ hasText: "Guidelines & Documents" }).first()).toBeVisible();
  109 |   });
  110 | 
  111 |   test("1.11 organizers section shows all 4 organizers", async ({ page }) => {
  112 |     await page.goto("/#organizers");
  113 |     for (const name of ["Nethaji R", "Aravind Muthiah M", "Jaganathan T", "Vinnarasu R"]) {
  114 |       await expect(page.getByText(name)).toBeVisible();
  115 |     }
  116 |   });
  117 | 
  118 |   test("1.12 sponsors section shows all sponsors", async ({ page }) => {
  119 |     await page.goto("/#sponsors");
```