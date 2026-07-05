import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const config = {
  matcher: ["/admin/:path*"],
  runtime: "nodejs", // Firebase Admin SDK needs Node runtime, not Edge
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("rezidence_admin_session")?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true); // checkRevoked = true
    return NextResponse.next();
  } catch (err) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("rezidence_admin_session");
    return response;
  }
}