// Test SPA auto-capture — Blazor client-side navigation
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = __dirname;
const SERVER = "http://localhost:5017";
const EMAIL = "admin@navtour.io";
const PASSWORD = "NavTour123!";

async function run() {
  console.log("=== SPA Auto-Capture Test ===\n");

  // API setup
  const loginRes = await fetch(`${SERVER}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const { accessToken } = await loginRes.json();

  const demoName = `SPA Test ${Date.now()}`;
  const demo = await fetch(`${SERVER}/api/v1/demos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name: demoName }),
  }).then(r => r.json());
  console.log(`Demo: "${demoName}" (${demo.id})`);

  // Launch browser with extension
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--no-first-run", "--disable-default-apps",
    ],
  });

  let extensionId;
  for (let i = 0; i < 15; i++) {
    for (const sw of context.serviceWorkers()) {
      if (sw.url().includes("chrome-extension://")) extensionId = sw.url().split("/")[2];
    }
    if (!extensionId) await context.waitForEvent("serviceworker", { timeout: 1000 }).catch(() => null);
    if (extensionId) break;
  }
  console.log(`Extension: ${extensionId}\n`);

  // Login to extension AND set capture state from the same popup page
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForSelector("#screen-login", { state: "visible", timeout: 3000 });
  await popup.fill("#server-url", SERVER);
  await popup.fill("#email", EMAIL);
  await popup.fill("#password", PASSWORD);
  await popup.click("#btn-login");
  await popup.waitForSelector("#screen-select", { state: "visible", timeout: 10000 });
  console.log("Extension logged in");

  // Set capture state from this same popup context (same storage partition)
  await popup.evaluate(async (args) => {
    await chrome.storage.local.set({
      captureState: { active: true, demoId: args.id, demoName: args.name, frameCount: 0, capturedUrls: [] },
    });
    chrome.runtime.sendMessage({ type: "START_CAPTURE" });
  }, { id: demo.id, name: demoName });

  // Verify storage
  const storageCheck = await popup.evaluate(async () => {
    const s = await chrome.storage.local.get(["session", "captureState"]);
    return { hasToken: !!s.session?.accessToken, captureActive: s.captureState?.active };
  });
  console.log(`Storage: token=${storageCheck.hasToken}, capture=${storageCheck.captureActive}`);
  // Keep popup open (don't close it — it shares the storage partition)

  await new Promise(r => setTimeout(r, 1000));

  // Navigate to the app
  const page = await context.newPage();

  // 1. Full page nav — auto-captures
  console.log("\n--- Page 1: / (full nav) ---");
  await page.goto(SERVER, { waitUntil: "load" });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitForCapture(page);
  await logStatus(page);

  // 2. Full page nav to login
  console.log("\n--- Page 2: /login (full nav) ---");
  await page.goto(`${SERVER}/login`, { waitUntil: "load" });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await waitForCapture(page);
  await logStatus(page);

  // 3. Log into the Blazor app
  console.log("\n--- Logging into Blazor app ---");
  const emailInput = await page.$('input[type="email"]') || await page.$('input[placeholder*="email" i]') || await page.$('input:first-of-type');
  const passInput = await page.$('input[type="password"]');
  if (emailInput && passInput) {
    await emailInput.fill(EMAIL);
    await passInput.fill(PASSWORD);
    const loginBtn = await page.$('button[type="submit"]') ||
      await page.$('.rz-button:has-text("Log")') ||
      await page.$('button:has-text("Log in")') ||
      await page.$('button:has-text("Login")') ||
      await page.$('button:has-text("Sign")');
    if (loginBtn) {
      await loginBtn.click();
      console.log("  Clicked login button");
    } else {
      console.log("  No login button found");
    }
  } else {
    console.log("  No login form found");
  }

  // Wait for SPA navigation after login
  await new Promise(r => setTimeout(r, 3000));
  console.log(`  URL after login: ${page.url()}`);
  await logStatus(page);

  // 4. Find and click SPA links
  console.log("\n--- Finding SPA links ---");
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map(a => ({ text: (a.textContent || "").trim().substring(0, 40), href: a.getAttribute("href") || "" }))
      .filter(l => l.href.startsWith("/") && l.text && !l.href.includes("logout") && l.text.length > 1)
      .reduce((acc, l) => {
        if (!acc.find(x => x.href === l.href)) acc.push(l);
        return acc;
      }, [])
      .slice(0, 8);
  });
  console.log(`Found ${links.length} unique internal links:`);
  for (const l of links) console.log(`  "${l.text}" → ${l.href}`);

  for (const link of links.slice(0, 4)) {
    console.log(`\n--- SPA click: "${link.text}" (${link.href}) ---`);
    const beforeUrl = page.url();

    try {
      await page.click(`a[href="${link.href}"]`, { timeout: 3000 });
    } catch {
      await page.goto(`${SERVER}${link.href}`, { waitUntil: "load" });
    }

    // Wait for URL to change (SPA)
    await page.waitForFunction(prev => location.href !== prev, beforeUrl, { timeout: 5000 }).catch(() => {});
    // Wait for capture (poll 800ms + render 500ms)
    await new Promise(r => setTimeout(r, 2500));
    await logStatus(page);
  }

  // 5. Direct nav to demo player
  console.log("\n--- Direct nav: /demo/p4licenses ---");
  await page.goto(`${SERVER}/demo/p4licenses`, { waitUntil: "load" });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  await logStatus(page);

  // API Verification
  console.log("\n--- API Verification ---");
  const framesRes = await fetch(`${SERVER}/api/v1/demos/${demo.id}/frames`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const apiFrames = await framesRes.json();
  console.log(`Total frames uploaded: ${apiFrames.length}`);

  const stateCheck = await popup.evaluate(async () => {
    const s = await chrome.storage.local.get(["captureState"]);
    return s.captureState?.capturedUrls || [];
  });
  console.log(`Captured URLs (${stateCheck.length}):`);
  for (const u of stateCheck) console.log(`  ${u}`);

  await context.close();
  console.log("\n=== TEST COMPLETE ===");
}

async function waitForCapture(page) {
  await page.waitForFunction(() => {
    const st = document.getElementById("navtour-status");
    return st && (st.textContent === "Captured!" || st.textContent === "Already captured");
  }, { timeout: 15000 }).catch(() => {});
}

async function logStatus(page) {
  const status = await page.locator("#navtour-status").textContent().catch(() => "?");
  const frames = await page.locator("#navtour-frame-count").textContent().catch(() => "?");
  console.log(`  URL: ${page.url()}`);
  console.log(`  Status: "${status}" | ${frames}`);
}

run().catch(e => { console.error("\nFAILED:", e); process.exit(1); });
