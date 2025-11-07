import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("Middleware triggered for:", request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
