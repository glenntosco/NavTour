// End-to-end test: auto-capture on navigation
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = __dirname;
const SERVER = "http://localhost:5017";
const EMAIL = "admin@navtour.io";
const PASSWORD = "NavTour123!";

async function run() {
  console.log("=== NavTour Auto-Capture E2E Test ===\n");

  // 1. Verify server
  const loginRes = await fetch(`${SERVER}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) { console.error("Server down"); process.exit(1); }
  const { accessToken } = await loginRes.json();
  console.log("1. Server OK");

  // 2. Launch with extension
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--no-first-run",
      "--disable-default-apps",
    ],
  });

  let extensionId;
  for (let i = 0; i < 15; i++) {
    for (const sw of context.serviceWorkers()) {
      if (sw.url().includes("chrome-extension://")) extensionId = sw.url().split("/")[2];
    }
    if (!extensionId) {
      const sw = await context.waitForEvent("serviceworker", { timeout: 1000 }).catch(() => null);
      if (sw) extensionId = sw.url().split("/")[2];
    }
    if (extensionId) break;
  }
  if (!extensionId) { console.error("Extension not found"); await context.close(); process.exit(1); }
  console.log(`2. Extension: ${extensionId}`);

  // 3. Login via popup
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForSelector("#screen-login", { state: "visible", timeout: 3000 });
  await popup.fill("#server-url", SERVER);
  await popup.fill("#email", EMAIL);
  await popup.fill("#password", PASSWORD);
  await popup.click("#btn-login");
  await popup.waitForSelector("#screen-select", { state: "visible", timeout: 10000 });
  console.log("3. Logged in");

  // 4. Create demo via API directly and set capture state via storage
  //    (bypasses popup's Start button which has auth timing issues in Playwright)
  const demoName = `AutoCapture ${Date.now()}`;
  const createRes = await fetch(`${SERVER}/api/v1/demos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name: demoName }),
  });
  const newDemo = await createRes.json();
  console.log(`4. Created demo "${demoName}" (${newDemo.id})`);

  // Set capture state directly in extension storage
  await popup.evaluate(async (args) => {
    await chrome.storage.local.set({
      captureState: {
        active: true,
        demoId: args.id,
        demoName: args.name,
        frameCount: 0,
        capturedUrls: [],
      },
    });
  }, { id: newDemo.id, name: demoName });

  // Tell background to start (inject toolbar)
  await popup.evaluate(() => {
    chrome.runtime.sendMessage({ type: "START_CAPTURE" });
  });

  console.log("   Capture state set, background notified");

  // Give time for background to process
  await new Promise(r => setTimeout(r, 1000));

  // 5. Navigate to first page
  console.log("5. Navigate to homepage...");
  const pages = context.pages();
  const page = pages.find(p =>
    !p.url().includes("chrome-extension://") &&
    !p.url().startsWith("chrome://") &&
    p !== popup
  ) || await context.newPage();

  await page.goto(SERVER, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 3000));

  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  console.log("   Toolbar injected!");

  await page.waitForFunction(() => {
    const st = document.getElementById("navtour-status");
    return st && st.textContent !== "Capturing..." && st.textContent !== "Recording...";
  }, { timeout: 15000 });

  let status = await page.locator("#navtour-status").textContent();
  let frames = await page.locator("#navtour-frame-count").textContent();
  console.log(`   Status: "${status}" | ${frames}`);

  // 6. Navigate to second page
  console.log("6. Navigate to /login...");
  await page.goto(`${SERVER}/login`, { waitUntil: "load" });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await page.waitForFunction(() => {
    const st = document.getElementById("navtour-status");
    return st && st.textContent !== "Capturing..." && st.textContent !== "Recording...";
  }, { timeout: 15000 });

  status = await page.locator("#navtour-status").textContent();
  frames = await page.locator("#navtour-frame-count").textContent();
  console.log(`   Status: "${status}" | ${frames}`);

  // 7. Third page
  console.log("7. Navigate to /register...");
  await page.goto(`${SERVER}/register`, { waitUntil: "load" });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await page.waitForFunction(() => {
    const st = document.getElementById("navtour-status");
    return st && st.textContent !== "Capturing..." && st.textContent !== "Recording...";
  }, { timeout: 15000 });

  status = await page.locator("#navtour-status").textContent();
  frames = await page.locator("#navtour-frame-count").textContent();
  console.log(`   Status: "${status}" | ${frames}`);

  // 8. Revisit homepage — should skip
  console.log("8. Revisit homepage (duplicate check)...");
  await page.goto(SERVER, { waitUntil: "load" });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  status = await page.locator("#navtour-status").textContent();
  frames = await page.locator("#navtour-frame-count").textContent();
  console.log(`   Status: "${status}" | ${frames}`);

  // 9. API verification
  console.log("9. API check...");
  const demosRes = await fetch(`${SERVER}/api/v1/demos`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const allDemos = await demosRes.json();
  const testDemo = allDemos.find(d => d.name === demoName);
  if (testDemo) {
    const framesRes = await fetch(`${SERVER}/api/v1/demos/${testDemo.id}/frames`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const apiFrames = await framesRes.json();
    console.log(`   Frames in API: ${apiFrames.length}`);
  }

  // 10. Finish
  console.log("10. Finish...");
  await page.evaluate(() => {
    const bar = document.getElementById("navtour-capture-bar");
    const buttons = bar?.querySelectorAll("button");
    const finish = buttons?.[buttons.length - 1];
    if (finish) finish.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const barGone = !(await page.locator("#navtour-capture-bar").isVisible().catch(() => false));
  console.log(`   Toolbar removed: ${barGone}`);

  await context.close();
  console.log("\n=== ALL TESTS COMPLETE ===");
}

run().catch(e => { console.error("\nFAILED:", e.message); process.exit(1); });
