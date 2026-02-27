import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { lat, lon, fileType = "json" } = await request.json();

    if (lat == null || lon == null) {
      return NextResponse.json(
        { error: "Missing Informations" },
        { status: 400 },
      );
    }

    const url = new URL("https://api.daaist.com/windrose");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("year", "2025");
    url.searchParams.set("fmt", String(fileType));

    const res = await fetch(url.toString());

    // If API returned an error, don't try to parse as JSON.
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "Upstream API error", status: res.status, body: errText },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") || "";

    // JSON response
    if (contentType.includes("application/json") || fileType === "json") {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Text response (SVG/XML)
    if (
      contentType.includes("image/svg+xml") ||
      contentType.includes("application/xml") ||
      contentType.includes("text/xml") ||
      fileType === "svg"
    ) {
      const text = await res.text();
      return new NextResponse(text, {
        headers: {
          "Content-Type": contentType || "image/svg+xml",
          "Cache-Control": "no-store",
        },
      });
    }

    // Binary response (png/pdf/etc)
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Bad request / invalid JSON body",
        details: String(e?.message || e),
      },
      { status: 400 },
    );
  }
}
