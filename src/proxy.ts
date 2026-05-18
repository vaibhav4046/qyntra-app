import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED = ["/home", "/dashboard", "/workspace", "/wiki", "/ask", "/files", "/sources", "/map", "/map-3d", "/read"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const hasDemoAccess = req.cookies.get("qyntra_demo")?.value === "1";

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected && !req.auth?.user && !hasDemoAccess) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/home/:path*",
    "/dashboard/:path*",
    "/workspace/:path*",
    "/wiki/:path*",
    "/ask/:path*",
    "/files/:path*",
    "/sources/:path*",
    "/map/:path*",
    "/map-3d/:path*",
    "/read/:path*",
  ],
};
