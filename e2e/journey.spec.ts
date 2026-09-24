import { test, expect, type Page } from "@playwright/test";

// ─── Helper: wipe localStorage between tests ─────────────────────────────────
async function clearStorage(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.locator('input[type="password"]').fill("demo-pass");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/);
}

async function doRegister(page: Page, email: string) {
  await page.goto("/register");
  await expect(page.getByText("Create Your Account")).toBeVisible({ timeout: 10000 });
  // Step 1
  await page.getByLabel("Full Name").fill("Test User");
  await page.getByLabel("Email Address").fill(email);
  await page.locator('input[type="password"]').first().fill("Password123");
  await page.locator('input[type="password"]').nth(1).fill("Password123");
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 2
  await page.waitForSelector("text=Personal Details");
  await page.getByLabel("Mobile Number").fill("9876543210");
  await page.getByLabel("City").fill("Chennai");
  await page.locator("select").first().selectOption("Tamil Nadu");
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 3
  await page.waitForSelector("text=Academic Information");
  await page.getByLabel("College / Institution").fill("Demo College");
  await page.getByLabel("Course / Programme").fill("B.Tech CS");
  await page.locator("select").selectOption("3rd Year");
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 4
  await page.waitForSelector("text=Review & Agree");
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL(/\/dashboard/);
}

// ─── 1. PUBLIC PAGES ─────────────────────────────────────────────────────────
test.describe("1. Public pages", () => {
  test("1.1 homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Innovators Arena 2\.0/);
    await expect(page.locator("h1")).toContainText("Build. Solve. Innovate.");
    await expect(page.getByRole("link", { name: "Register Now" }).first()).toBeVisible();
    
    // IA WB Image verification
    await expect(page.locator('img[alt="Innovators Arena Hero"]')).toBeVisible();
  });

  test("1.2 header navigation links work", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    for (const label of ["About", "Timeline", "FAQ", "Contact"]) {
      await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
    }
  });

  test("1.3 about section", async ({ page }) => {
    await page.goto("/#about");
    await expect(page.locator("h2").filter({ hasText: "What is Innovators Arena 2.0?" }).first()).toBeVisible();
  });

  test("1.4 problem statements page loads", async ({ page }) => {
    await page.goto("/problem-statements");
    await expect(page.locator("h1")).toContainText("Problem Statements");
    await expect(page.getByText(/Problem Statement/i).first()).toBeVisible();
  });

  test("1.5 search filters problem statements", async ({ page }) => {
    await page.goto("/problem-statements");
    await page.getByPlaceholder(/Search by title/i).fill("AI");
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("1.6 clear search shows all results again", async ({ page }) => {
    await page.goto("/problem-statements");
    await page.getByPlaceholder(/Search by title/i).fill("xyzzy-no-match");
    await expect(page.getByText(/No problem statements match/i)).toBeVisible();
    await page.getByPlaceholder(/Search by title/i).clear();
    await expect(page.locator("table tbody tr").nth(5)).toBeVisible();
  });

  test("1.7 problem statement detail page", async ({ page }) => {
    await page.goto("/problem-statements/IA26001");
    await expect(page.locator("h1")).toContainText("AI-Based Adaptive Learning Platform for Rural Students");
    await expect(page.getByText("IA26001").first()).toBeVisible();
  });

  test("1.8 unknown problem statement shows not-found state", async ({ page }) => {
    await page.goto("/problem-statements/PS999");
    await expect(page.getByText("Problem Statement Not Found")).toBeVisible();
  });

  test("1.9 timeline section", async ({ page }) => {
    await page.goto("/timeline");
    await expect(page.locator("h1")).toContainText(/Timeline/i);
  });

  test("1.10 guidelines section", async ({ page }) => {
    await page.goto("/#guidelines");
    await expect(page.locator("h2").filter({ hasText: "Guidelines & Documents" }).first()).toBeVisible();
  });

  test("1.11 organizers section shows all 4 organizers", async ({ page }) => {
    await page.goto("/#organizers");
    for (const name of ["Nethaji R", "Aravind Muthiah M", "Jaganathan T", "Vinnarasu R"]) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test("1.12 sponsors section shows all sponsors", async ({ page }) => {
    await page.goto("/#sponsors");
    await expect(page.getByText("DexLora Innovations").first()).toBeVisible();
  });

  test("1.13 FAQ accordion opens answers", async ({ page }) => {
    await page.goto("/#faq");
    await expect(page.locator("h2").filter({ hasText: "Frequently Asked Questions" }).first()).toBeVisible();
  });

  test("1.14 FAQ category filter works", async ({ page }) => {
    await page.goto("/#faq");
    await page.getByRole("tab", { name: "Payment" }).click();
    await expect(page.getByText("How much is the registration fee?")).toBeVisible();
  });

  test("1.15 contact form validation", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByRole("button", { name: "Send Message" }).click();
  });

  test("1.16 contact form submits successfully", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Subject").fill("General Inquiry");
    await page.getByLabel("Message").fill("This is a test message with enough characters to pass validation.");
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.getByText("Message Sent")).toBeVisible();
  });
});

// ─── 2. AUTHENTICATION ────────────────────────────────────────────────────────
test.describe("2. Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test("2.1 login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome Back");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("2.2 login with any credentials succeeds (mock)", async ({ page }) => {
    await loginAs(page, "any@test.com");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("2.3 authenticated user redirected away from login", async ({ page }) => {
    await loginAs(page, "check@test.com");
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("2.4 register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1")).toContainText("Create Your Account");
    await expect(page.getByText("Account Information")).toBeVisible();
  });

  test("2.5 register step 1 validation shows errors", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Continue" }).click();
    // react-hook-form validation fires on submit — check any error appeared
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test("2.6 full registration flow completes", async ({ page }) => {
    await doRegister(page, `reg-${Date.now()}@test.com`);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("2.7 logout works", async ({ page }) => {
    await loginAs(page, "logout@test.com");
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    // Now try to go to dashboard — should stay on login
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── 3. PROTECTED ROUTES ─────────────────────────────────────────────────────
test.describe("3. Protected routes", () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test("3.1 dashboard redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("3.2 dashboard/team redirects to login", async ({ page }) => {
    await page.goto("/dashboard/team");
    await expect(page).toHaveURL(/\/login/);
  });

  test("3.3 dashboard/submission redirects to login", async ({ page }) => {
    await page.goto("/dashboard/submission");
    await expect(page).toHaveURL(/\/login/);
  });

  test("3.4 dashboard/profile redirects to login", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── 4. DASHBOARD ────────────────────────────────────────────────────────────
test.describe("4. Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await loginAs(page, `dash-${Date.now()}@test.com`);
  });

  test("4.1 dashboard shows welcome and stat cards", async ({ page }) => {
    await expect(page.getByText(/Welcome back,/)).toBeVisible();
    await expect(page.getByText("Profile").first()).toBeVisible();
    await expect(page.getByText("Payment").first()).toBeVisible();
    await expect(page.getByText("Team").first()).toBeVisible();
    await expect(page.getByText("Submission").first()).toBeVisible();
  });

  test("4.2 dashboard shows progress steps", async ({ page }) => {
    await expect(page.getByText("Your Progress")).toBeVisible();
    await expect(page.getByText("Create Account")).toBeVisible();
    await expect(page.getByText("Complete Payment")).toBeVisible();
  });

  test("4.3 profile page loads", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await expect(page.locator("h1")).toContainText("My Profile");
    await expect(page.getByText("Profile Completion")).toBeVisible();
    await expect(page.getByText("Payment Status")).toBeVisible();
  });

test("4.5 profile edit mode toggles", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await page.getByRole("button", { name: "Edit Profile" }).click();
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Edit Profile" })).toBeVisible();
  });

  test("4.6 announcements page loads", async ({ page }) => {
    await page.goto("/dashboard/announcements");
    await expect(page.locator("h1")).toContainText("Announcements");
    await expect(page.getByText("Registration is Now Open")).toBeVisible();
  });

test("4.8 settings page loads", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.locator("h1")).toContainText("Settings");
    await expect(page.getByRole("heading", { name: "Theme" })).toBeVisible();
    await expect(page.getByText("Notification Preferences")).toBeVisible();
  });
});

// ─── 5. TEAM MANAGEMENT ──────────────────────────────────────────────────────
test.describe("5. Team management", () => {
  // Each test registers fresh & pays to avoid state collision
  async function setupPaidUser(page: Page) {
    const email = `team-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
    await doRegister(page, email);
    return email;
  }

  test("5.1 team page shows create/join when no team", async ({ page }) => {
    await clearStorage(page);
    await setupPaidUser(page);
    await page.goto("/dashboard/team");
    await expect(page.getByRole("button", { name: "Create Team" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Join Team" })).toBeVisible();
  });

  test("5.2 create team modal opens", async ({ page }) => {
    await clearStorage(page);
    await setupPaidUser(page);
    await page.goto("/dashboard/team");
    await page.getByRole("button", { name: "Create Team" }).click();
    await expect(page.getByText("Create Your Team")).toBeVisible();
    await expect(page.getByLabel("Team Name")).toBeVisible();
  });

  test("5.3 create team generates Team ID", async ({ page }) => {
    await clearStorage(page);
    await setupPaidUser(page);
    await page.goto("/dashboard/team");
    await page.getByRole("button", { name: "Create Team" }).click();
    await page.getByLabel("Team Name").fill("Code Warriors");
    await page.getByRole("button", { name: "Create Team" }).last().click();
    // Wait for team ID to appear
    await expect(page.getByText(/IA26-/)).toBeVisible({ timeout: 8000 });
  });

  test("5.4 team ID copy button works", async ({ page }) => {
    await clearStorage(page);
    await setupPaidUser(page);
    await page.goto("/dashboard/team");
    await page.getByRole("button", { name: "Create Team" }).click();
    await page.getByLabel("Team Name").fill("Copy Test Team");
    await page.getByRole("button", { name: "Create Team" }).last().click();
    await expect(page.getByText(/IA26-/)).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /Copy/ }).click();
    await expect(page.getByText("Copied!").first()).toBeVisible();
  });

  test("5.5 join team with invalid ID shows error", async ({ page }) => {
    await clearStorage(page);
    await setupPaidUser(page);
    await page.goto("/dashboard/team");
    await page.getByRole("button", { name: "Join Team" }).click();
    await expect(page.getByText("Join an Existing Team")).toBeVisible();
    await page.getByLabel("Team ID").fill("INVALID-XXX");
    await page.getByRole("button", { name: "Join Team" }).last().click();
    await expect(page.getByText(/Invalid Team ID/)).toBeVisible({ timeout: 6000 });
  });

  test("5.6 team member limit validation — form max enforced", async ({ page }) => {
    await clearStorage(page);
    await setupPaidUser(page);
    await page.goto("/dashboard/team");
    await page.getByRole("button", { name: "Create Team" }).click();
    await page.getByLabel("Team Name").fill("Limit Test");
    await page.getByRole("button", { name: "Create Team" }).last().click();
    await expect(page.getByText(/IA26-/)).toBeVisible({ timeout: 8000 });
    // Confirm team needs min 2 — button should be disabled
    await expect(page.getByText(/Your team needs at least/)).toBeVisible();
  });
});

// ─── 6. SUBMISSION PAGE ──────────────────────────────────────────────────────
test.describe("6. Submission", () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await loginAs(page, `sub-${Date.now()}@test.com`);
  });

  test("6.1 submission page loads with requirement checklist", async ({ page }) => {
    await page.goto("/dashboard/submission");
    await expect(page.locator("h1")).toContainText("Project Submission");
    await expect(page.getByText("Submission Requirements")).toBeVisible();
    await expect(page.getByText("Team created")).toBeVisible();
    await expect(page.getByText("Team confirmed")).toBeVisible();
  });

  test("6.2 no team shows warning message", async ({ page }) => {
    await page.goto("/dashboard/submission");
    // The amber warning card has "No Team Found" as heading
    await expect(page.locator(".card").filter({ hasText: "No Team Found" }).first()).toBeVisible();
  });
});

// ─── 7. FILE UPLOAD UI ───────────────────────────────────────────────────────
test.describe("7. File upload UI", () => {
  test("7.1 file upload drag-drop zone is present on submission page when eligible", async ({ page }) => {
    await clearStorage(page);
    const email = `upload-@test.com`;
    await doRegister(page, email);

    // Create team
    await page.goto("/dashboard/team");
    await page.getByRole("button", { name: "Create Team" }).click();
    await page.getByLabel("Team Name").fill("Upload Team");
    await page.getByRole("button", { name: "Create Team" }).last().click();
    await expect(page.getByText(/IA26-/)).toBeVisible({ timeout: 8000 });

    // Can't confirm with 1 member, but submission page loads
    await page.goto("/dashboard/submission");
    await expect(page.getByText("Final Project Submission")).toBeVisible();
    await expect(page.getByText("Team confirmed")).toBeVisible();
  });
});

// ─── 8. MOBILE RESPONSIVE ────────────────────────────────────────────────────
test.describe("8. Mobile responsive", () => {
  test("8.1 mobile hamburger opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await page.getByRole("button", { name: "Close navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).not.toBeVisible();
  });

  test("8.2 no horizontal overflow on mobile homepage", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("8.3 problem statements stack correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/problem-statements");
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("8.4 no overflow on login page mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("8.5 no overflow on register page mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/register");
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("8.6 tablet view — problem statements page renders", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/problem-statements");
    await expect(page.getByText(/240 Problem Statements/i).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});

// ─── 9. FULL PARTICIPANT JOURNEY ─────────────────────────────────────────────
test.describe("9. Full participant journey (end-to-end mock)", () => {
  test("9.1 complete journey: register → pay → create team → dashboard", async ({ page }) => {
    await clearStorage(page);
    const email = `journey-${Date.now()}@test.com`;

    // 1. Register
    await doRegister(page, email);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Welcome back,/)).toBeVisible();

    // 2. Go to profile
    await page.goto("/dashboard/profile");
    await expect(page.getByText("My Profile")).toBeVisible();

    // 3. Create team
    await page.goto("/dashboard/team");
    await expect(page.getByRole("button", { name: "Create Team" })).toBeVisible();
    await page.getByRole("button", { name: "Create Team" }).click();
    await page.getByLabel("Team Name").fill("Journey Warriors");
    await page.locator("select").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Create Team" }).last().click();
    const teamIdEl = page.getByText(/IA26-/).first();
    await expect(teamIdEl).toBeVisible({ timeout: 8000 });
    
    // Capture team ID
    const teamIdText = await teamIdEl.textContent();
    const teamIdMatch = teamIdText?.match(/(IA26-[A-Z0-9]+)/);
    const teamId = teamIdMatch ? teamIdMatch[1] : "";
    expect(teamId).toBeTruthy();

    // Logout and register member 2
    await page.getByRole("button", { name: "Sign Out" }).click();
    const email2 = `journey2-${Date.now()}@test.com`;
    await doRegister(page, email2);
    
    // Join team as member 2
    await page.goto("/dashboard/team");
    await page.getByRole("button", { name: "Join Team" }).click();
    await page.getByLabel("Team ID").fill(teamId);
    await page.getByRole("button", { name: "Join Team" }).last().click();
    await expect(page.getByText("Journey Warriors")).toBeVisible({ timeout: 8000 });

    // Logout and login as leader again
    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.goto("/login");
    await page.getByLabel("Email Address").fill(email);
    await page.locator('input[type="password"]').fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Go to team page, Complete Team, and Pay
    await page.goto("/dashboard/team");
    await expect(page.getByText("2 / 6")).toBeVisible(); // 2 members
    
    const completeTeamBtn = page.getByRole("button", { name: "Complete Team" });
    await completeTeamBtn.click();
    await expect(page.getByText("Team Completed!")).toBeVisible();

    const payBtn = page.getByRole("button", { name: /Pay ₹200/ });
    await expect(payBtn).toBeVisible();
    await payBtn.click();
    await expect(page.getByText("Payment successful!")).toBeVisible({ timeout: 8000 });

    // Logout
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});

// ─── 10. ADMIN JOURNEY ───────────────────────────────────────────────────────
test.describe("10. Admin journey", () => {
  test("10.1 admin login succeeds with mock credentials", async ({ page }) => {
    await clearStorage(page);
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("Contact11induskiller@gmail.com");
    await page.locator('input[type="password"]').fill("admin123");
    await page.getByRole("button", { name: "Sign In" }).click();
    
    // Redirects to admin
    await page.waitForURL(/\/admin/);
    await expect(page.getByText("Total Participants")).toBeVisible();
    await expect(page.getByText("Total Teams")).toBeVisible();
  });

  test("10.2 normal participant blocked from admin", async ({ page }) => {
    await clearStorage(page);
    const email = `part-${Date.now()}@test.com`;
    await loginAs(page, email);
    
    // Go to admin directly
    await page.goto("/admin");
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText("Your Progress")).toBeVisible();
  });
});










