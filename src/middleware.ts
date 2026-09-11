import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/history" ||
    pathname.startsWith("/history/") ||
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (!userId && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (userId && PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/history/:path*",
    "/analytics/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
