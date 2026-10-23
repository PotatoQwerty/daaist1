import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDiagramAppearance,
  SUN_PATH_PALETTE,
  WIND_ROSE_PALETTE,
} from "../src/lib/diagramAppearance.ts";

test("appearance defaults to light and leaves automatic colors to the backend", () => {
  for (const count of [3, 5] as const) {
    assert.deepEqual(parseDiagramAppearance({}, count), { theme: "light" });
    for (const theme of ["light", "transparent"]) {
      assert.deepEqual(parseDiagramAppearance({ theme }, count), { theme });
    }
  }
});

test("appearance preserves palette order and maps manual text to the query name", () => {
  for (const palette of [SUN_PATH_PALETTE, WIND_ROSE_PALETTE]) {
    assert.deepEqual(
      parseDiagramAppearance({ theme: "transparent", palette, textColor: "#aB12EF", ignored: "value" }, palette.length as 3 | 5),
      { theme: "transparent", palette: palette.join(","), text_color: "#aB12EF" },
    );
  }
});

test("appearance rejects invalid themes, palette lengths, hex and HTML", () => {
  for (const count of [3, 5] as const) {
    const palette = Array<string>(count).fill("#112233");
    for (const theme of [null, "dark", "", 1, "<script>alert(1)</script>"]) {
      assert.equal(parseDiagramAppearance({ theme }, count), null);
    }
    for (const invalid of [null, "#112233", [], palette.slice(1), [...palette, "#445566"]]) {
      assert.equal(parseDiagramAppearance({ palette: invalid }, count), null);
    }
    for (const color of [null, 123456, "112233", "#123", "#12345678", "#GG1122", "#112233\n", "<img src=x onerror=alert(1)>"]) {
      assert.equal(parseDiagramAppearance({ palette: [color, ...palette.slice(1)] }, count), null);
      assert.equal(parseDiagramAppearance({ textColor: color }, count), null);
    }
  }
});
