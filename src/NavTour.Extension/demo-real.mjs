// Live demo — capture GitHub, finish opens builder (logged in)
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = "http://localhost:5017";
const EMAIL = "admin@navtour.io";
const PASS = "NavTour123!";

async function run() {
  // Create demo via API
  const { accessToken } = await fetch(`${SERVER}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  }).then((r) => r.json());

  const demo = await fetch(`${SERVER}/api/v1/demos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name: "GitHub Capture Demo" }),
  }).then((r) => r.json());
  console.log("Demo created:", demo.id);

  // Launch browser
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    viewport: { width: 1400, height: 900 },
    slowMo: 300,
    args: [
      `--disable-extensions-except=${__dirname}`,
      `--load-extension=${__dirname}`,
      "--no-first-run",
      "--disable-default-apps",
    ],
  });

  let extensionId;
  for (let i = 0; i < 15; i++) {
    for (const sw of context.serviceWorkers())
      if (sw.url().includes("chrome-extension://")) extensionId = sw.url().split("/")[2];
    if (!extensionId)
      await context.waitForEvent("serviceworker", { timeout: 1000 }).catch(() => null);
    if (extensionId) break;
  }
  console.log("Extension:", extensionId);

  // === PRE-STEP: Log into NavTour in the browser so builder tab works ===
  console.log("\n--- Logging into NavTour in browser ---");
  const loginPage = await context.newPage();
  await loginPage.goto(`${SERVER}/login`, { waitUntil: "domcontentloaded", timeout: 10000 });
  await sleep(1500);

  const emailInput =
    (await loginPage.$('input[type="email"]')) ||
    (await loginPage.$('input[placeholder*="email" i]')) ||
    (await loginPage.$("input:first-of-type"));
  const passInput = await loginPage.$('input[type="password"]');
  if (emailInput && passInput) {
    await emailInput.fill(EMAIL);
    await passInput.fill(PASS);
    const btn =
      (await loginPage.$('button[type="submit"]')) ||
      (await loginPage.$("button:has-text('Sign')")) ||
      (await loginPage.$("button:has-text('Log')"));
    if (btn) await btn.click();
    await sleep(3000);
    console.log("  Logged in, URL:", loginPage.url());
  }
  // Keep this tab open (it has the auth session/cookies)

  // === Login to extension ===
  console.log("\n--- Extension login ---");
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForSelector("#screen-login", { state: "visible" });
  await popup.fill("#server-url", SERVER);
  await popup.fill("#email", EMAIL);
  await popup.fill("#password", PASS);
  await popup.click("#btn-login");
  await popup.waitForSelector("#screen-select", { state: "visible", timeout: 10000 });
  console.log("  Extension logged in");

  // Activate capture mode
  await popup.evaluate(
    async (args) => {
      await chrome.storage.local.set({
        captureState: {
          active: true,
          demoId: args.id,
          demoName: "GitHub Capture Demo",
          serverUrl: args.server,
          frameCount: 0,
          capturedUrls: [],
        },
      });
      chrome.runtime.sendMessage({ type: "START_CAPTURE" });
    },
    { id: demo.id, server: SERVER }
  );
  await sleep(1000);

  // === CAPTURE GITHUB ===
  const page = await context.newPage();
  await page.bringToFront();

  console.log("\n--- Page 1: github.com ---");
  await page.goto("https://github.com", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(2000);

  console.log("\n--- Page 2: github.com/explore ---");
  await page.goto("https://github.com/explore", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(2000);

  console.log("\n--- Page 3: github.com/microsoft/vscode ---");
  await page.goto("https://github.com/microsoft/vscode", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(2000);

  console.log("\n--- Page 4: Click Issues tab (SPA) ---");
  const beforeUrl = page.url();
  await page.click('a:has-text("Issues")').catch(() => {});
  await page
    .waitForFunction((prev) => location.href !== prev, beforeUrl, { timeout: 5000 })
    .catch(() => {});
  await sleep(2500);
  await logStatus(page);

  console.log("\n--- Page 5: github.com/pricing ---");
  await page.goto("https://github.com/pricing", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(2000);

  // === FINISH — navigates existing NavTour tab to builder ===
  console.log("\n--- Clicking Finish ---");
  await page.evaluate(() => {
    const bar = document.getElementById("navtour-capture-bar");
    const btns = bar?.querySelectorAll("button");
    if (btns) btns[btns.length - 1].click();
  });
  await sleep(4000);

  console.log("  GitHub tab:", page.url(), "(preserved)");
  console.log("  NavTour tab:", loginPage.url());

  const isBuilder = loginPage.url().includes("/demos/") && loginPage.url().includes("/edit");
  if (isBuilder) {
    console.log("  Builder loaded in existing NavTour tab!");
  } else {
    console.log("  NavTour tab navigated to:", loginPage.url());
  }

  // Verify frames
  const apiFrames = await fetch(`${SERVER}/api/v1/demos/${demo.id}/frames`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.json());
  console.log(`\n=== ${apiFrames.length} frames captured from GitHub ===`);
  for (const f of apiFrames) {
    const detail = await fetch(`${SERVER}/api/v1/frames/${f.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json());
    console.log(`  Frame #${f.sequenceOrder}: ${(detail.htmlContent?.length / 1024).toFixed(0)}KB`);
  }

  console.log("\nBrowser open for 20 seconds...");
  await sleep(20000);
  await context.close();
  console.log("Done.");
}

async function waitCaptured(page) {
  await page
    .waitForFunction(
      () => {
        const s = document.getElementById("navtour-status");
        return s && (s.textContent === "Captured!" || s.textContent === "Already captured");
      },
      { timeout: 20000 }
    )
    .catch(() => {});
}

async function logStatus(page) {
  const st = await page.locator("#navtour-status").textContent().catch(() => "?");
  const fr = await page.locator("#navtour-frame-count").textContent().catch(() => "?");
  console.log(`  Status: "${st}" | ${fr}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

run().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
