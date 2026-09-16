import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PROTECTED = [/^\/$/, /^\/log$/, /^\/analytics$/, /^\/settings(?:\/.*)?$/];
const AUTH_PAGES = [/^\/login$/, /^\/register$/];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parsed = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const signedIn = Boolean(parsed);

  if (!signedIn && PROTECTED.some((pattern) => pattern.test(pathname))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (signedIn && AUTH_PAGES.some((pattern) => pattern.test(pathname))) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/log", "/analytics", "/settings/:path*"],
};
