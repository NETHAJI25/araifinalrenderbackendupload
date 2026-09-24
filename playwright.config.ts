import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  timeout: 25000,
  reporter: [["line"]],
  use: {
    baseURL: "http://localhost:5174",
    screenshot: "only-on-failure",
    video: "off",
    trace: "off",
    actionTimeout: 8000,
    navigationTimeout: 10000,
  },
  projects: [
    {
      name: "chrome",
      use: {
        channel: "chrome",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 5174,
    reuseExistingServer: true,
  },
});
