import { NextResponse, type NextRequest } from "next/server";

// Optimistic check: no session cookie → go to the login page.
// The real session validation happens in the portal layout (src/app/portal/layout.tsx).
export function proxy(request: NextRequest) {
  if (!request.cookies.get("sp_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/portal/:path*",
};
