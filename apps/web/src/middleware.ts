import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    // Admin-only routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
    }

    // Partner + Admin routes
    if (
      pathname.startsWith("/partner") &&
      role !== "PARTNER" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
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
