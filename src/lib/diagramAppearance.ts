export type DiagramAppearance = {
  theme: "light" | "transparent";
  palette: string[];
  textColor?: string;
};

export const SUN_PATH_PALETTE = ["#C46635", "#9B822D", "#287E94"];
export const WIND_ROSE_PALETTE = ["#BBD7D1", "#73ADA7", "#347E87", "#D5A352", "#B85B36"];

export function parseDiagramAppearance(
  body: Record<string, unknown>,
  colorCount: 3 | 5,
): Record<string, string> | null {
  const theme = body.theme === undefined ? "light" : body.theme;
  if (theme !== "light" && theme !== "transparent") return null;

  const query: Record<string, string> = { theme };
  const hex = /^#[0-9a-fA-F]{6}$/;

  if (body.palette !== undefined) {
    if (
      !Array.isArray(body.palette) ||
      body.palette.length !== colorCount ||
      !body.palette.every((color) => typeof color === "string" && color.length === 7 && hex.test(color))
    ) return null;
    query.palette = body.palette.join(",");
  }

  if (body.textColor !== undefined) {
    if (typeof body.textColor !== "string" || body.textColor.length !== 7 || !hex.test(body.textColor)) return null;
    query.text_color = body.textColor;
  }

  return query;
}
