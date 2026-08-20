import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    // The admin sign-in page has to be reachable by someone who isn't signed
    // in yet — that's the whole point of it.
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    // Admin-only routes — SUPER_ADMIN is a strict superset of ADMIN
    if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
    }

    // Partner + Admin routes
    if (
      pathname.startsWith("/partner") &&
      role !== "PARTNER" &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    // Mirror the authOptions fallback so the proxy can decode JWTs
    // even when NEXTAUTH_SECRET is absent and SESSION_SECRET is used instead.
    secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET,
    callbacks: {
      // /admin/login must be reachable without a token, same reason as above —
      // withAuth's authorized gate runs before the proxy function, so the
      // bypass has to live here too or an anonymous visitor never gets past it.
      authorized: ({ token, req }) =>
        req.nextUrl.pathname.startsWith("/admin/login") || !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/partner/:path*",
    "/settings/:path*",
  ],
};
