// Live demo — capture CNN.com pages in visible Chrome
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = "http://localhost:5017";
const EMAIL = "admin@navtour.io";
const PASS = "NavTour123!";

async function run() {
  const { accessToken } = await fetch(`${SERVER}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  }).then((r) => r.json());

  const demoName = `CNN Demo ${Date.now()}`;
  const createRes = await fetch(`${SERVER}/api/v1/demos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name: demoName }),
  });
  if (!createRes.ok) {
    console.error("Failed to create demo:", createRes.status, await createRes.text().catch(() => ""));
    process.exit(1);
  }
  const demo = await createRes.json();
  console.log("Demo created:", demo.id);

  const context = await chromium.launchPersistentContext("", {
    headless: false,
    viewport: { width: 1400, height: 900 },
    slowMo: 400,
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

  // Log into NavTour via API call in Playwright (sets auth cookie in browser)
  console.log("\n--- Logging into NavTour ---");
  const navtourPage = await context.newPage();
  await navtourPage.goto(SERVER, { waitUntil: "domcontentloaded", timeout: 10000 });
  // Call login API from the page context so the cookie gets set on the browser
  await navtourPage.evaluate(async (args) => {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: args.email, password: args.pass }),
      credentials: "same-origin",
    });
    return res.ok;
  }, { email: EMAIL, pass: PASS });
  // Reload to pick up the auth state
  await navtourPage.goto(SERVER, { waitUntil: "domcontentloaded", timeout: 10000 });
  await sleep(2000);
  console.log("  NavTour logged in:", navtourPage.url());

  // Login to extension + set capture state
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForSelector("#screen-login", { state: "visible" });
  await popup.fill("#server-url", SERVER);
  await popup.fill("#email", EMAIL);
  await popup.fill("#password", PASS);
  await popup.click("#btn-login");
  await popup.waitForSelector("#screen-select", { state: "visible", timeout: 10000 });

  await popup.evaluate(async (args) => {
    await chrome.storage.local.set({
      captureState: {
        active: true, demoId: args.id, demoName: "CNN Demo Tour",
        serverUrl: args.server, frameCount: 0, capturedUrls: [],
      },
    });
    chrome.runtime.sendMessage({ type: "START_CAPTURE" });
  }, { id: demo.id, server: SERVER });
  console.log("  Capture mode started\n");
  await sleep(1000);

  // Open CNN
  const page = await context.newPage();
  await page.bringToFront();

  // PAGE 1: CNN Homepage
  console.log("--- Page 1: cnn.com ---");
  await page.goto("https://www.cnn.com", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(3000);

  // PAGE 2: CNN World
  console.log("\n--- Page 2: cnn.com/world ---");
  await page.goto("https://www.cnn.com/world", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(3000);

  // PAGE 3: CNN Business
  console.log("\n--- Page 3: cnn.com/business ---");
  await page.goto("https://www.cnn.com/business", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(3000);

  // PAGE 4: CNN Tech
  console.log("\n--- Page 4: cnn.com/business/tech ---");
  await page.goto("https://www.cnn.com/business/tech", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(3000);

  // PAGE 5: CNN Weather
  console.log("\n--- Page 5: cnn.com/weather ---");
  await page.goto("https://www.cnn.com/weather", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitCaptured(page);
  await logStatus(page);
  await sleep(3000);

  // FINISH
  console.log("\n--- Clicking Finish ---");
  const newTabPromise = context.waitForEvent("page", { timeout: 10000 }).catch(() => null);
  await page.evaluate(() => {
    const bar = document.getElementById("navtour-capture-bar");
    const btns = bar?.querySelectorAll("button");
    if (btns) btns[btns.length - 1].click();
  });

  const builderTab = await newTabPromise;
  await sleep(3000);

  console.log("  CNN tab:", page.url(), "(preserved)");
  if (builderTab) {
    await builderTab.waitForLoadState("domcontentloaded").catch(() => {});
    await sleep(2000);
    console.log("  Builder tab:", builderTab.url());
    const isBuilder = builderTab.url().includes("/demos/") && builderTab.url().includes("/edit");
    console.log("  Builder loaded:", isBuilder ? "YES" : "NO");
  }

  // API verification
  console.log("\n--- API Verification ---");
  const apiFrames = await fetch(`${SERVER}/api/v1/demos/${demo.id}/frames`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.json());
  console.log(`Total frames: ${apiFrames.length}`);
  for (const f of apiFrames) {
    const detail = await fetch(`${SERVER}/api/v1/frames/${f.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((r) => r.json());
    console.log(`  Frame #${f.sequenceOrder}: ${(detail.htmlContent?.length / 1024).toFixed(0)}KB`);
  }

  console.log("\nBrowser open for 30 seconds — check it out...");
  await sleep(30000);
  await context.close();
  console.log("Done.");
}

async function waitCaptured(page) {
  await page.waitForFunction(() => {
    const s = document.getElementById("navtour-status");
    return s && (s.textContent === "Captured!" || s.textContent === "Already captured");
  }, { timeout: 20000 }).catch(() => {});
}

async function logStatus(page) {
  const st = await page.locator("#navtour-status").textContent().catch(() => "?");
  const fr = await page.locator("#navtour-frame-count").textContent().catch(() => "?");
  console.log(`  Status: "${st}" | ${fr}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

run().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
