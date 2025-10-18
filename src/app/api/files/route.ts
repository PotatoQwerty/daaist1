import { NextResponse } from "next/server";

export async function GET() {
  const endpoint = "https://neural-climbing-ampland-requests.trycloudflare.com";

  try {
    const res = await fetch(endpoint);

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) {
      const errorText = await res.text();
      console.error(
        "Unexpected response from upstream:",
        errorText.slice(0, 300)
      );
      return NextResponse.json(
        { error: "Upstream server did not return valid JSON." },
        { status: 502 }
      );
    }

    const files = await res.json();
    return NextResponse.json(files);
  } catch (error: any) {
    console.error("Failed to fetch files:", error.message || error);
    return NextResponse.json(
      { error: "Failed to load files from upstream." },
      { status: 500 }
    );
  }
}
