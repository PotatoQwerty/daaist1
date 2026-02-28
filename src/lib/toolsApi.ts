const DEFAULT_TOOLS_API_BASE_URL = "https://api.daaist.com";

export function getToolsApiBaseUrl(): string {
  const raw =
    process.env.TOOLS_API_BASE_URL ||
    process.env.NEXT_PUBLIC_TOOLS_API_BASE_URL ||
    DEFAULT_TOOLS_API_BASE_URL;

  return raw.replace(/\/+$/, "");
}

export function buildToolsApiUrl(
  path: string,
  query: Record<string, string>,
): URL {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${getToolsApiBaseUrl()}${normalizedPath}`);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  return url;
}
