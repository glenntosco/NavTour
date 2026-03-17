// Live automated demo — watch in the browser window
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
    body: JSON.stringify({ name: "Live Demo" }),
  }).then((r) => r.json());

  // Launch visible browser with extension
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    viewport: { width: 1280, height: 800 },
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

  // STEP 1: Open extension popup
  console.log("STEP 1: Opening extension popup...");
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForSelector("#screen-login", { state: "visible" });
  await sleep(1000);

  // STEP 2: Login
  console.log("STEP 2: Logging in...");
  await popup.fill("#server-url", SERVER);
  await popup.fill("#email", EMAIL);
  await popup.fill("#password", PASS);
  await sleep(500);
  await popup.click("#btn-login");
  await popup.waitForSelector("#screen-select", { state: "visible", timeout: 10000 });
  console.log("  Logged in! Demo list visible.");
  await sleep(1500);

  // STEP 3: Start capture
  console.log("STEP 3: Starting capture mode...");
  await popup.evaluate(
    async (args) => {
      await chrome.storage.local.set({
        captureState: {
          active: true,
          demoId: args.id,
          demoName: "Live Demo",
          serverUrl: args.server,
          frameCount: 0,
          capturedUrls: [],
        },
      });
      chrome.runtime.sendMessage({ type: "START_CAPTURE" });
    },
    { id: demo.id, server: SERVER }
  );
  await sleep(1500);

  // STEP 4: Navigate to homepage — auto-capture
  console.log("STEP 4: Navigating to homepage...");
  const page = await context.newPage();
  await page.bringToFront();
  await page.goto(SERVER, { waitUntil: "load" });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById("navtour-status")?.textContent === "Captured!",
    { timeout: 15000 }
  );
  console.log("  Homepage auto-captured!");
  await sleep(2000);

  // STEP 5: Navigate to login page — auto-capture
  console.log("STEP 5: Navigating to /login...");
  await page.goto(`${SERVER}/login`, { waitUntil: "load" });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await page.waitForFunction(
    () => {
      const s = document.getElementById("navtour-status");
      return s && (s.textContent === "Captured!" || s.textContent === "Already captured");
    },
    { timeout: 15000 }
  );
  console.log("  Login page auto-captured!");
  await sleep(2000);

  // STEP 6: Login to Blazor app
  console.log("STEP 6: Logging into the Blazor app...");
  const emailInput =
    (await page.$('input[type="email"]')) ||
    (await page.$('input[placeholder*="email" i]'));
  const passInput = await page.$('input[type="password"]');
  if (emailInput && passInput) {
    await emailInput.fill(EMAIL);
    await passInput.fill(PASS);
    const btn =
      (await page.$('button[type="submit"]')) ||
      (await page.$("button:has-text('Sign')")) ||
      (await page.$("button:has-text('Log')"));
    if (btn) await btn.click();
    console.log("  Signed in.");
  }
  await sleep(3000);
  console.log("  URL: " + page.url());

  // STEP 7: Click around inside the app (SPA navigation)
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({
        text: (a.textContent || "").trim().substring(0, 30),
        href: a.getAttribute("href") || "",
      }))
      .filter((l) => l.href.startsWith("/") && l.text.length > 1 && !l.href.includes("logout"))
      .reduce((acc, l) => {
        if (!acc.find((x) => x.href === l.href)) acc.push(l);
        return acc;
      }, [])
      .slice(0, 3)
  );

  for (const link of links) {
    console.log(`STEP: Clicking "${link.text}" (${link.href})...`);
    const before = page.url();
    await page.click(`a[href="${link.href}"]`, { timeout: 3000 }).catch(() => {});
    await page
      .waitForFunction((prev) => location.href !== prev, before, { timeout: 5000 })
      .catch(() => {});
    await sleep(2500);
    const st = await page.locator("#navtour-status").textContent().catch(() => "?");
    const fr = await page.locator("#navtour-frame-count").textContent().catch(() => "?");
    console.log(`  ${st} | ${fr}`);
  }

  // STEP 8: Trigger a popup
  console.log("STEP: Triggering a modal popup...");
  await page.evaluate(() => {
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.style.cssText =
      "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;height:260px;background:white;z-index:9999;padding:28px;box-shadow:0 0 30px rgba(0,0,0,0.4);border-radius:12px;font-family:sans-serif;";
    const h2 = document.createElement("h2");
    h2.style.cssText = "margin:0 0 16px;color:#1a1a2e";
    h2.textContent = "Delete Tenant?";
    modal.appendChild(h2);
    const p = document.createElement("p");
    p.style.color = "#555";
    p.textContent = "This will permanently remove the tenant and all associated data.";
    modal.appendChild(p);
    const btns = document.createElement("div");
    btns.style.cssText = "margin-top:20px;display:flex;gap:12px";
    const del = document.createElement("button");
    del.style.cssText =
      "padding:10px 24px;background:#e63946;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer";
    del.textContent = "Delete";
    btns.appendChild(del);
    const cancel = document.createElement("button");
    cancel.style.cssText =
      "padding:10px 24px;background:#eee;color:#333;border:none;border-radius:6px;font-size:14px;cursor:pointer";
    cancel.textContent = "Cancel";
    btns.appendChild(cancel);
    modal.appendChild(btns);
    document.body.appendChild(modal);
  });
  await sleep(2500);
  const popSt = await page.locator("#navtour-status").textContent().catch(() => "?");
  const popFr = await page.locator("#navtour-frame-count").textContent().catch(() => "?");
  console.log(`  Popup: ${popSt} | ${popFr}`);
  await sleep(2000);

  // STEP 9: Click Finish
  console.log("STEP: Clicking Finish...");
  await page.evaluate(() => {
    const bar = document.getElementById("navtour-capture-bar");
    const btns = bar?.querySelectorAll("button");
    if (btns) btns[btns.length - 1].click();
  });
  await sleep(3000);
  console.log("  Final URL: " + page.url());

  // Verify
  const apiFrames = await fetch(`${SERVER}/api/v1/demos/${demo.id}/frames`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.json());
  console.log(`\n=== ${apiFrames.length} frames captured and uploaded ===`);

  // Keep browser open so user can see the result
  console.log("Browser open for 15 seconds...");
  await sleep(15000);
  await context.close();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

run().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
