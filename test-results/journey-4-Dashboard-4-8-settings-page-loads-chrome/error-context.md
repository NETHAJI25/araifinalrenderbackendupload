# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journey.spec.ts >> 4. Dashboard >> 4.8 settings page loads
- Location: e2e\journey.spec.ts:270:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Settings"
Received string:    "My Profile"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('h1') with timeout 5000ms
  - waiting for locator('h1')
    13 × locator resolved to <h1 class="text-2xl font-black text-gray-900">My Profile</h1>
       - unexpected value "My Profile"

```

```yaml
- heading "My Profile" [level=1]
```

# Test source

```ts
  172 | 
  173 |   test("2.4 register page loads", async ({ page }) => {
  174 |     await page.goto("/register");
  175 |     await expect(page.locator("h1")).toContainText("Create Your Account");
  176 |     await expect(page.getByText("Account Information")).toBeVisible();
  177 |   });
  178 | 
  179 |   test("2.5 register step 1 validation shows errors", async ({ page }) => {
  180 |     await page.goto("/register");
  181 |     await page.getByRole("button", { name: "Continue" }).click();
  182 |     // react-hook-form validation fires on submit — check any error appeared
  183 |     await expect(page.locator('[role="alert"]').first()).toBeVisible();
  184 |   });
  185 | 
  186 |   test("2.6 full registration flow completes", async ({ page }) => {
  187 |     await doRegister(page, `reg-${Date.now()}@test.com`);
  188 |     await expect(page).toHaveURL(/\/dashboard/);
  189 |   });
  190 | 
  191 |   test("2.7 logout works", async ({ page }) => {
  192 |     await loginAs(page, "logout@test.com");
  193 |     await page.getByRole("button", { name: "Sign Out" }).click();
  194 |     await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  195 |     // Now try to go to dashboard — should stay on login
  196 |     await page.goto("/dashboard");
  197 |     await expect(page).toHaveURL(/\/login/);
  198 |   });
  199 | });
  200 | 
  201 | // ─── 3. PROTECTED ROUTES ─────────────────────────────────────────────────────
  202 | test.describe("3. Protected routes", () => {
  203 |   test.beforeEach(async ({ page }) => {
  204 |     await clearStorage(page);
  205 |   });
  206 | 
  207 |   test("3.1 dashboard redirects to login when not authenticated", async ({ page }) => {
  208 |     await page.goto("/dashboard");
  209 |     await expect(page).toHaveURL(/\/login/);
  210 |   });
  211 | 
  212 |   test("3.2 dashboard/team redirects to login", async ({ page }) => {
  213 |     await page.goto("/dashboard/team");
  214 |     await expect(page).toHaveURL(/\/login/);
  215 |   });
  216 | 
  217 |   test("3.3 dashboard/submission redirects to login", async ({ page }) => {
  218 |     await page.goto("/dashboard/submission");
  219 |     await expect(page).toHaveURL(/\/login/);
  220 |   });
  221 | 
  222 |   test("3.4 dashboard/profile redirects to login", async ({ page }) => {
  223 |     await page.goto("/dashboard/profile");
  224 |     await expect(page).toHaveURL(/\/login/);
  225 |   });
  226 | });
  227 | 
  228 | // ─── 4. DASHBOARD ────────────────────────────────────────────────────────────
  229 | test.describe("4. Dashboard", () => {
  230 |   test.beforeEach(async ({ page }) => {
  231 |     await clearStorage(page);
  232 |     await loginAs(page, `dash-${Date.now()}@test.com`);
  233 |   });
  234 | 
  235 |   test("4.1 dashboard shows welcome and stat cards", async ({ page }) => {
  236 |     await expect(page.getByText(/Welcome back,/)).toBeVisible();
  237 |     await expect(page.getByText("Profile").first()).toBeVisible();
  238 |     await expect(page.getByText("Payment").first()).toBeVisible();
  239 |     await expect(page.getByText("Team").first()).toBeVisible();
  240 |     await expect(page.getByText("Submission").first()).toBeVisible();
  241 |   });
  242 | 
  243 |   test("4.2 dashboard shows progress steps", async ({ page }) => {
  244 |     await expect(page.getByText("Your Progress")).toBeVisible();
  245 |     await expect(page.getByText("Create Account")).toBeVisible();
  246 |     await expect(page.getByText("Complete Payment")).toBeVisible();
  247 |   });
  248 | 
  249 |   test("4.3 profile page loads", async ({ page }) => {
  250 |     await page.goto("/dashboard/profile");
  251 |     await expect(page.locator("h1")).toContainText("My Profile");
  252 |     await expect(page.getByText("Profile Completion")).toBeVisible();
  253 |     await expect(page.getByText("Payment Status")).toBeVisible();
  254 |   });
  255 | 
  256 | test("4.5 profile edit mode toggles", async ({ page }) => {
  257 |     await page.goto("/dashboard/profile");
  258 |     await page.getByRole("button", { name: "Edit Profile" }).click();
  259 |     await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
  260 |     await page.getByRole("button", { name: "Cancel" }).click();
  261 |     await expect(page.getByRole("button", { name: "Edit Profile" })).toBeVisible();
  262 |   });
  263 | 
  264 |   test("4.6 announcements page loads", async ({ page }) => {
  265 |     await page.goto("/dashboard/announcements");
  266 |     await expect(page.locator("h1")).toContainText("Announcements");
  267 |     await expect(page.getByText("Registration is Now Open")).toBeVisible();
  268 |   });
  269 | 
  270 | test("4.8 settings page loads", async ({ page }) => {
  271 |     await page.goto("/dashboard/settings");
> 272 |     await expect(page.locator("h1")).toContainText("Settings");
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  273 |     await expect(page.getByRole("heading", { name: "Theme" })).toBeVisible();
  274 |     await expect(page.getByText("Notification Preferences")).toBeVisible();
  275 |   });
  276 | });
  277 | 
  278 | // ─── 5. TEAM MANAGEMENT ──────────────────────────────────────────────────────
  279 | test.describe("5. Team management", () => {
  280 |   // Each test registers fresh & pays to avoid state collision
  281 |   async function setupPaidUser(page: Page) {
  282 |     const email = `team-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  283 |     await doRegister(page, email);
  284 |     return email;
  285 |   }
  286 | 
  287 |   test("5.1 team page shows create/join when no team", async ({ page }) => {
  288 |     await clearStorage(page);
  289 |     await setupPaidUser(page);
  290 |     await page.goto("/dashboard/team");
  291 |     await expect(page.getByRole("button", { name: "Create Team" })).toBeVisible();
  292 |     await expect(page.getByRole("button", { name: "Join Team" })).toBeVisible();
  293 |   });
  294 | 
  295 |   test("5.2 create team modal opens", async ({ page }) => {
  296 |     await clearStorage(page);
  297 |     await setupPaidUser(page);
  298 |     await page.goto("/dashboard/team");
  299 |     await page.getByRole("button", { name: "Create Team" }).click();
  300 |     await expect(page.getByText("Create Your Team")).toBeVisible();
  301 |     await expect(page.getByLabel("Team Name")).toBeVisible();
  302 |   });
  303 | 
  304 |   test("5.3 create team generates Team ID", async ({ page }) => {
  305 |     await clearStorage(page);
  306 |     await setupPaidUser(page);
  307 |     await page.goto("/dashboard/team");
  308 |     await page.getByRole("button", { name: "Create Team" }).click();
  309 |     await page.getByLabel("Team Name").fill("Code Warriors");
  310 |     await page.getByRole("button", { name: "Create Team" }).last().click();
  311 |     // Wait for team ID to appear
  312 |     await expect(page.getByText(/IA26-/)).toBeVisible({ timeout: 8000 });
  313 |   });
  314 | 
  315 |   test("5.4 team ID copy button works", async ({ page }) => {
  316 |     await clearStorage(page);
  317 |     await setupPaidUser(page);
  318 |     await page.goto("/dashboard/team");
  319 |     await page.getByRole("button", { name: "Create Team" }).click();
  320 |     await page.getByLabel("Team Name").fill("Copy Test Team");
  321 |     await page.getByRole("button", { name: "Create Team" }).last().click();
  322 |     await expect(page.getByText(/IA26-/)).toBeVisible({ timeout: 8000 });
  323 |     await page.getByRole("button", { name: /Copy/ }).click();
  324 |     await expect(page.getByText("Copied!").first()).toBeVisible();
  325 |   });
  326 | 
  327 |   test("5.5 join team with invalid ID shows error", async ({ page }) => {
  328 |     await clearStorage(page);
  329 |     await setupPaidUser(page);
  330 |     await page.goto("/dashboard/team");
  331 |     await page.getByRole("button", { name: "Join Team" }).click();
  332 |     await expect(page.getByText("Join an Existing Team")).toBeVisible();
  333 |     await page.getByLabel("Team ID").fill("INVALID-XXX");
  334 |     await page.getByRole("button", { name: "Join Team" }).last().click();
  335 |     await expect(page.getByText(/Invalid Team ID/)).toBeVisible({ timeout: 6000 });
  336 |   });
  337 | 
  338 |   test("5.6 team member limit validation — form max enforced", async ({ page }) => {
  339 |     await clearStorage(page);
  340 |     await setupPaidUser(page);
  341 |     await page.goto("/dashboard/team");
  342 |     await page.getByRole("button", { name: "Create Team" }).click();
  343 |     await page.getByLabel("Team Name").fill("Limit Test");
  344 |     await page.getByRole("button", { name: "Create Team" }).last().click();
  345 |     await expect(page.getByText(/IA26-/)).toBeVisible({ timeout: 8000 });
  346 |     // Confirm team needs min 2 — button should be disabled
  347 |     await expect(page.getByText(/Your team needs at least/)).toBeVisible();
  348 |   });
  349 | });
  350 | 
  351 | // ─── 6. SUBMISSION PAGE ──────────────────────────────────────────────────────
  352 | test.describe("6. Submission", () => {
  353 |   test.beforeEach(async ({ page }) => {
  354 |     await clearStorage(page);
  355 |     await loginAs(page, `sub-${Date.now()}@test.com`);
  356 |   });
  357 | 
  358 |   test("6.1 submission page loads with requirement checklist", async ({ page }) => {
  359 |     await page.goto("/dashboard/submission");
  360 |     await expect(page.locator("h1")).toContainText("Project Submission");
  361 |     await expect(page.getByText("Submission Requirements")).toBeVisible();
  362 |     await expect(page.getByText("Team created")).toBeVisible();
  363 |     await expect(page.getByText("Team confirmed")).toBeVisible();
  364 |   });
  365 | 
  366 |   test("6.2 no team shows warning message", async ({ page }) => {
  367 |     await page.goto("/dashboard/submission");
  368 |     // The amber warning card has "No Team Found" as heading
  369 |     await expect(page.locator(".card").filter({ hasText: "No Team Found" }).first()).toBeVisible();
  370 |   });
  371 | });
  372 | 
```