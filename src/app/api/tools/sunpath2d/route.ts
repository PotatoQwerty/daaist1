import { NextResponse } from "next/server";
import { buildToolsApiUrl } from "@/lib/toolsApi";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type FileType = "png" | "svg";
const FIXED_TIMEZONE = "Africa/Algiers";
const CURRENT_YEAR = new Date().getFullYear();
const MIN_ALLOWED_YEAR = 1900;
const MAX_ALLOWED_YEAR = CURRENT_YEAR - 1;

function parseFileType(value: unknown): FileType {
  return value === "svg" ? "svg" : "png";
}

function parseYear(value: unknown): number | null {
  if (value == null) {
    return MAX_ALLOWED_YEAR;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const normalized = Math.trunc(value);
  if (normalized < MIN_ALLOWED_YEAR || normalized > MAX_ALLOWED_YEAR) {
    return null;
  }

  return normalized;
}

function parseLatLon(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

export async function POST(request: Request) {
  // Unauthenticated and each call does real work upstream, so this is keyed
  // by IP. Sized to let someone iterate on coordinates without tripping it.
  const limited = enforceRateLimit(request, RATE_LIMITS.tools, {
    bucket: "tools-sunpath2d",
  });
  if (limited) return limited;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const lat = parseLatLon(body.lat);
    const lon = parseLatLon(body.lon);
    const fileType = parseFileType(body.fileType);
    const year = parseYear(body.year);
    const tz = FIXED_TIMEZONE;

    if (lat == null || lon == null) {
      return NextResponse.json(
        { error: "Missing or invalid coordinates" },
        { status: 400 },
      );
    }
    if (year == null) {
      return NextResponse.json(
        {
          error: `Year must be between ${MIN_ALLOWED_YEAR} and ${MAX_ALLOWED_YEAR}. Current year (${CURRENT_YEAR}) is not allowed.`,
        },
        { status: 400 },
      );
    }

    const url = buildToolsApiUrl("/sunpath2d", {
      lat: String(lat),
      lon: String(lon),
      year: String(year),
      tz,
      fmt: fileType,
    });

    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      const errText = await res.text();
      // The upstream body can carry its own internals; log it, do not relay it.
      console.error("Tools upstream error:", res.status, errText);
      return NextResponse.json(
        { error: "Upstream API error", status: res.status },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (
      contentType.includes("image/svg+xml") ||
      contentType.includes("application/xml") ||
      contentType.includes("text/xml")
    ) {
      const text = await res.text();
      return new NextResponse(text, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
        },
      });
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Tools request failed:", error);
    return NextResponse.json(
      { error: "Bad request / invalid JSON body" },
      { status: 400 },
    );
  }
}
