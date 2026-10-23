import test from "node:test";
import assert from "node:assert/strict";
import { POST as sunpath2d } from "../src/app/api/tools/sunpath2d/route.ts";
import { POST as sunpath3d } from "../src/app/api/tools/sunpath3d/route.ts";
import { POST as windrose } from "../src/app/api/tools/windrose/route.ts";
import { SUN_PATH_PALETTE, WIND_ROSE_PALETTE } from "../src/lib/diagramAppearance.ts";

const routes = [
  { path: "/sunpath2d", post: sunpath2d, palette: SUN_PATH_PALETTE },
  { path: "/sunpath3d", post: sunpath3d, palette: SUN_PATH_PALETTE },
  { path: "/windrose", post: windrose, palette: WIND_ROSE_PALETTE },
];
const coordinates = { lat: -33.87, lon: 151.21, year: 2025 };
let requestId = 0;
function request(body: unknown) {
  return new Request("http://localhost/api/tools/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": `192.0.2.${++requestId}` },
    body: JSON.stringify(body),
  });
}

for (const { path, post, palette } of routes) {
  test(`${path}: forwards encoded appearance and preserves PNG/SVG downloads`, async (t) => {
    for (const theme of ["light", "transparent"]) {
      for (const fileType of ["png", "svg"]) {
        const bytes = fileType === "png"
          ? Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==", "base64")
          : Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="700"><text fill="#FFFFFF">No seasonal data</text></svg>');
        const contentType = fileType === "png" ? "image/png" : "image/svg+xml";
        const fetchMock = t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
          const url = new URL(String(input));
          assert.equal(url.pathname, path);
          assert.equal(url.hash, "");
          assert.match(url.search, /palette=%23/);
          assert.match(url.search, /text_color=%23FFFFFF/);
          assert.deepEqual(Object.fromEntries(url.searchParams), {
            lat: String(coordinates.lat), lon: String(coordinates.lon), year: "2025",
            ...(path === "/windrose" ? {} : { tz: "Africa/Algiers" }),
            fmt: fileType, theme, palette: palette.join(","), text_color: "#FFFFFF",
          });
          assert.equal(init?.cache, "no-store");
          return new Response(bytes, { headers: { "Content-Type": contentType } });
        });
        const response = await post(request({ ...coordinates, fileType, theme, palette, textColor: "#FFFFFF", tz: "ignored", arbitrary: "ignored" }));
        assert.equal(fetchMock.mock.callCount(), 1);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type"), contentType);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
        fetchMock.mock.restore();
      }
    }
  });

  test(`${path}: old requests use light and omit custom palette/text`, async (t) => {
    const fetchMock = t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
      const query = new URL(String(input)).searchParams;
      assert.equal(query.get("theme"), "light");
      assert.equal(query.has("palette"), false);
      assert.equal(query.has("text_color"), false);
      return new Response("png", { headers: { "Content-Type": "image/png" } });
    });
    assert.equal((await post(request(coordinates))).status, 200);
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  test(`${path}: invalid appearance is rejected before upstream work`, async (t) => {
    const fetchMock = t.mock.method(globalThis, "fetch", () => { throw new Error("must not fetch"); });
    for (const invalid of [{ theme: "dark" }, { palette: palette.slice(1) }, { textColor: "<script>" }]) {
      const response = await post(request({ ...coordinates, ...invalid }));
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "Invalid diagram colors or background" });
    }
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test(`${path}: upstream errors do not expose backend details`, async (t) => {
    t.mock.method(console, "error", () => {});
    t.mock.method(globalThis, "fetch", async () => new Response("private backend details", { status: 422 }));
    const response = await post(request({ ...coordinates, theme: "light", palette }));
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "Upstream API error", status: 422 });
  });
}
