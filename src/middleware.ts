import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (!userId && (pathname === "/" || pathname.startsWith("/settings"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (userId && PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register"],
};
