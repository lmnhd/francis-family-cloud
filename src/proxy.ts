// Next.js 16 route guard (replaces middleware.ts).
// Runs in the Edge runtime — no DynamoDB or NAPI modules allowed here.
// Session verification uses @auth/core/jwt to decrypt the Auth.js JWT cookie.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "@auth/core/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    // Auth.js uses the Secure- prefix in production.
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/box", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/box/:path*", "/admin/:path*"],
};
