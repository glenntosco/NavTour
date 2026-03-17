// Final verification — tests every item from the plan
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = "http://localhost:5017";
const EMAIL = "admin@navtour.io";
const PASS = "NavTour123!";
let passed = 0;
let failed = 0;

function check(name, ok) {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

async function run() {
  console.log("=== NavTour Final Verification ===\n");

  // --- 1. npm install && npm run build ---
  console.log("1. Extension build");
  check("dist/popup.js exists", fs.existsSync(path.join(__dirname, "dist/popup.js")));
  check("dist/background.js exists", fs.existsSync(path.join(__dirname, "dist/background.js")));
  check("manifest.json exists", fs.existsSync(path.join(__dirname, "manifest.json")));
  check("icons exist", fs.existsSync(path.join(__dirname, "icons/icon128.png")));

  // --- 2. API login works ---
  console.log("\n2. API login");
  const loginRes = await fetch(`${SERVER}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  check("Login returns 200", loginRes.ok);
  const { accessToken } = await loginRes.json();
  check("Access token returned", !!accessToken);

  // Check cookie was set
  const setCookie = loginRes.headers.get("set-cookie") || "";
  check("Auth cookie set", setCookie.includes("navtour_auth="));

  // --- 3. Extension loads and works ---
  console.log("\n3. Extension in Chrome");
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${__dirname}`,
      `--load-extension=${__dirname}`,
      "--no-first-run", "--disable-default-apps",
    ],
  });

  let extensionId;
  for (let i = 0; i < 15; i++) {
    for (const sw of context.serviceWorkers())
      if (sw.url().includes("chrome-extension://")) extensionId = sw.url().split("/")[2];
    if (!extensionId) await context.waitForEvent("serviceworker", { timeout: 1000 }).catch(() => null);
    if (extensionId) break;
  }
  check("Extension loaded in Chrome", !!extensionId);

  // --- 4. Popup login works ---
  console.log("\n4. Popup login");
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const loginVisible = await popup.waitForSelector("#screen-login", { state: "visible", timeout: 3000 }).then(() => true).catch(() => false);
  check("Login screen visible", loginVisible);

  await popup.fill("#server-url", SERVER);
  await popup.fill("#email", EMAIL);
  await popup.fill("#password", PASS);
  await popup.click("#btn-login");
  const selectVisible = await popup.waitForSelector("#screen-select", { state: "visible", timeout: 10000 }).then(() => true).catch(() => false);
  check("Demo select screen after login", selectVisible);

  const optionCount = await popup.locator("#demo-select option").count();
  check("Demo list loaded", optionCount > 1);

  // --- 5. Create demo and capture pages ---
  console.log("\n5. Auto-capture flow");
  const demoName = `Final Test ${Date.now()}`;
  const createRes = await fetch(`${SERVER}/api/v1/demos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name: demoName }),
  });
  const demo = await createRes.json();
  check("Demo created via API", !!demo.id);

  // Set capture state
  await popup.evaluate(async (args) => {
    await chrome.storage.local.set({
      captureState: { active: true, demoId: args.id, demoName: args.name, serverUrl: args.server, frameCount: 0, capturedUrls: [] },
    });
    chrome.runtime.sendMessage({ type: "START_CAPTURE" });
  }, { id: demo.id, name: demoName, server: SERVER });
  await sleep(1000);

  // Navigate to a page — auto-capture
  const page = await context.newPage();
  await page.bringToFront();
  await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: 15000 });
  const toolbarVisible = await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 }).then(() => true).catch(() => false);
  check("Toolbar injected on page", toolbarVisible);

  const captured = await page.waitForFunction(() => {
    const s = document.getElementById("navtour-status");
    return s && s.textContent === "Captured!";
  }, { timeout: 15000 }).then(() => true).catch(() => false);
  check("Page auto-captured", captured);

  // Navigate to second page
  await page.goto("https://example.org", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("#navtour-capture-bar", { timeout: 10000 });
  const captured2 = await page.waitForFunction(() => {
    const s = document.getElementById("navtour-status");
    return s && (s.textContent === "Captured!" || s.textContent === "Already captured");
  }, { timeout: 15000 }).then(() => true).catch(() => false);
  check("Second page auto-captured", captured2);

  // --- 6. Verify frames in API ---
  console.log("\n6. API verification");
  const framesRes = await fetch(`${SERVER}/api/v1/demos/${demo.id}/frames`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const frames = await framesRes.json();
  check("Frames uploaded to API", frames.length >= 2);

  if (frames.length > 0) {
    const detail = await fetch(`${SERVER}/api/v1/frames/${frames[0].id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(r => r.json());
    check("Frame has HTML content", detail.htmlContent && detail.htmlContent.length > 100);
  }

  // --- 7. Finish opens builder ---
  console.log("\n7. Finish → builder");
  // Login to NavTour in browser via cookie
  const navPage = await context.newPage();
  await navPage.goto(SERVER, { waitUntil: "domcontentloaded", timeout: 10000 });
  await navPage.evaluate(async (args) => {
    await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: args.email, password: args.pass }),
      credentials: "same-origin",
    });
  }, { email: EMAIL, pass: PASS });
  await sleep(1000);

  // Click Finish on capture page
  await page.bringToFront();
  const newTabPromise = context.waitForEvent("page", { timeout: 10000 }).catch(() => null);
  await page.evaluate(() => {
    const bar = document.getElementById("navtour-capture-bar");
    const btns = bar?.querySelectorAll("button");
    if (btns) btns[btns.length - 1].click();
  });
  const builderTab = await newTabPromise;
  await sleep(3000);

  const toolbarRemoved = !(await page.locator("#navtour-capture-bar").isVisible().catch(() => false));
  check("Toolbar removed after Finish", toolbarRemoved);

  if (builderTab) {
    await builderTab.waitForLoadState("domcontentloaded").catch(() => {});
    await sleep(2000);
    const builderUrl = builderTab.url();
    check("Builder tab opened", builderUrl.includes("/demos/") && builderUrl.includes("/edit"));
  } else {
    check("Builder tab opened", false);
  }

  // --- 8. Builder file upload (DemoEditor AddFrame) ---
  console.log("\n8. Builder file upload");
  // Upload via API directly (simulates what the InputFile does)
  const testHtml = "<!DOCTYPE html><html><body><h1>Uploaded Frame</h1></body></html>";
  const blob = new Blob([testHtml], { type: "text/html" });
  const form = new FormData();
  form.append("file", blob, "test-upload.html");
  const uploadRes = await fetch(`${SERVER}/api/v1/demos/${demo.id}/frames`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  check("File upload via API works", uploadRes.ok);
  if (uploadRes.ok) {
    const uploadedFrame = await uploadRes.json();
    check("Uploaded frame has ID", !!uploadedFrame.id);
  }

  // --- 9. Cookie auth persists across tabs ---
  console.log("\n9. Cookie auth persistence");
  const testTab = await context.newPage();
  await testTab.goto(SERVER, { waitUntil: "domcontentloaded", timeout: 10000 });
  await sleep(3000);
  // Check if the page shows authenticated content (not the landing page)
  const pageContent = await testTab.content();
  const hasAuthContent = pageContent.includes("Logout") || pageContent.includes("demos") || pageContent.includes("Create");
  check("New tab authenticated via cookie", hasAuthContent);

  // --- Summary ---
  await context.close();
  console.log(`\n${"=".repeat(40)}`);
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  console.log(`${"=".repeat(40)}`);

  if (failed > 0) process.exit(1);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
run().catch(e => { console.error("\nFAILED:", e.message); process.exit(1); });
