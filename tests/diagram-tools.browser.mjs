// Run against npm run start -- --port 3100: node tests/diagram-tools.browser.mjs
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.addInitScript(() => {
    window.revokedDiagramUrls = [];
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url) => { window.revokedDiagramUrls.push(url); revoke(url); };
  });
  const requests = [];
  let release;
  await page.route("**/api/tools/*", async (route) => {
    const body = route.request().postDataJSON();
    requests.push({ path: new URL(route.request().url()).pathname, body });
    await new Promise((resolve) => { release = resolve; });
    const square = route.request().url().endsWith("sunpath2d");
    const content = body.fileType === "png"
      ? Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==", "base64")
      : Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${square ? 900 : 1100}" height="${square ? 900 : 700}"><text x="30" y="60" fill="${body.textColor || "#FFFFFF"}">Diagram preview fixture</text></svg>`);
    await route.fulfill({ contentType: body.fileType === "png" ? "image/png" : "image/svg+xml", body: content });
  });
  await page.goto(process.env.DIAGRAM_TEST_URL || "http://localhost:3100/tools");
  await page.addStyleTag({ content: "*, *::before, *::after { animation: none !important; transition: none !important; }" });
  await page.getByRole("group", { name: "Appearance" }).waitFor();
  await mkdir("screenshots/diagrams", { recursive: true });

  for (const [accordion, endpoint, firstLabel, count, ratio] of [
    ["Wind rose", "windrose", "0.5–2 m/s", 5, 11 / 7],
    ["Sun path, 2D", "sunpath2d", "Summer solstice", 3, 1],
    ["Sun path, 3D", "sunpath3d", "Summer solstice", 3, 11 / 7],
  ]) {
    const trigger = page.getByRole("button", { name: new RegExp(`^${accordion}`) });
    if (await trigger.getAttribute("aria-expanded") !== "true") await trigger.click();
    const panel = page.locator('[data-slot="accordion-content"][data-state="open"]');
    const fields = panel.getByRole("group", { name: "Appearance" });
    assert.equal(await fields.locator('input[type="color"]').count(), count);
    const background = fields.getByLabel("Background", { exact: true });
    const firstHex = fields.getByLabel(`${firstLabel} hex code`, { exact: true });
    await fields.getByLabel(firstLabel, { exact: true }).evaluate((input) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "#2468ac");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal((await firstHex.inputValue()).toLowerCase(), "#2468ac");
    await firstHex.fill("#9D4EDD");
    await background.selectOption("transparent");
    assert.equal((await fields.getByLabel(firstLabel, { exact: true }).inputValue()).toLowerCase(), "#9d4edd");
    await fields.getByLabel("Automatic text color", { exact: true }).uncheck();
    await fields.getByLabel("Text color hex code", { exact: true }).fill("#FFFFFF");
    await background.selectOption("light");
    assert.equal(await fields.getByLabel("Text color hex code", { exact: true }).inputValue(), "#FFFFFF");
    await background.selectOption("transparent");

    await panel.getByLabel("Enter your site's coordinates", { exact: true }).fill('36°44\'44.5"N 3°01\'12.4"E');
    await panel.getByText("SVG", { exact: true }).click();
    const pendingSvg = page.waitForRequest("**/api/tools/*");
    await panel.getByRole("button", { name: /^Generate/ }).click();
    await pendingSvg;
    assert.equal(await panel.locator("button").filter({ hasText: "Generating..." }).isDisabled(), true);
    const submitted = requests.at(-1);
    assert.equal(submitted.path, `/api/tools/${endpoint}`);
    assert.deepEqual({ theme: submitted.body.theme, first: submitted.body.palette[0], text: submitted.body.textColor },
      { theme: "transparent", first: "#9D4EDD", text: "#FFFFFF" });
    assert.equal(submitted.body.palette.length, count);

    // Form edits during generation must not change the returned file's metadata.
    await background.selectOption("light");
    await panel.getByText("PNG", { exact: true }).click();
    release(); release = undefined;
    const download = panel.getByRole("link", { name: "Download", exact: true });
    await download.waitFor();
    assert.match(await download.getAttribute("download"), /-transparent-\d+\.svg$/);
    const href = await download.getAttribute("href");
    const surface = panel.getByRole("button", { name: "Dark preview surface: on" });
    await surface.click();
    await panel.getByRole("button", { name: "Dark preview surface: off" }).waitFor();
    assert.equal(await download.getAttribute("href"), href);
    const image = panel.locator('img[src^="blob:"]');
    const box = await image.boundingBox();
    assert.ok(Math.abs(box.width / box.height - ratio) < 0.01);
    const downloadEvent = page.waitForEvent("download");
    await download.click();
    const file = await downloadEvent;
    assert.match(await readFile(await file.path(), "utf8"), /^<svg/);

    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await fields.screenshot({ path: `screenshots/diagrams/${endpoint}-controls-dark.png` });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await fields.screenshot({ path: `screenshots/diagrams/${endpoint}-controls-light.png` });

    await fields.getByRole("button", { name: "Reset colors" }).click();
    assert.equal(await fields.getByLabel("Automatic text color").isChecked(), true);
    assert.equal(await firstHex.inputValue(), endpoint === "windrose" ? "#BBD7D1" : "#C46635");
    await firstHex.fill("#bad");
    await firstHex.blur();
    assert.equal(await firstHex.inputValue(), endpoint === "windrose" ? "#BBD7D1" : "#C46635");
    const pendingPng = page.waitForRequest("**/api/tools/*");
    await panel.getByRole("button", { name: /^Generate/ }).click();
    await pendingPng;
    assert.equal(Object.hasOwn(requests.at(-1).body, "textColor"), false);
    release(); release = undefined;
    await download.waitFor();
    assert.match(await download.getAttribute("download"), /-light-\d+\.png$/);
    assert.equal(await panel.getByRole("button", { name: /^Dark preview surface:/ }).count(), 0);
    assert.ok(await page.evaluate((url) => window.revokedDiagramUrls.includes(url), href));
    console.log(`${endpoint}: color/hex sync, reset, request snapshot, surfaces, ratios, SVG download and URL cleanup passed`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.getByRole("group", { name: "Appearance" }).screenshot({ path: "screenshots/diagrams/controls-mobile.png" });
  assert.equal(requests.length, 6);
} finally {
  await browser.close();
}
