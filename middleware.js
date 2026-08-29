import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Get cookies
  const token = request.cookies.get("jwt")?.value;
  const userType = request.cookies.get("user_type")?.value;

  // Public paths - redirect to dashboard if already logged in
  const publicPaths = ["/auth/login", "/auth/signup"];
  if (publicPaths.includes(path)) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // --- PROTECTED ROUTES ---

  // 1. Dashboard requires authentication (any user)
  if (path.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 2. Admin panel - ONLY admin role
  if (path.startsWith("/admin")) {
    if (!token)
      return NextResponse.redirect(new URL("/auth/login", request.url));
    if (userType !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Instructor routes - allow admin, content_manager, instructor
  if (path.startsWith("/instructor")) {
    if (!token)
      return NextResponse.redirect(new URL("/auth/login", request.url));
    if (!["admin", "content_manager", "instructor"].includes(userType)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 4. Blog Manager - only admin and content_manager
  if (path.startsWith("/blog-manager")) {
    if (!token)
      return NextResponse.redirect(new URL("/auth/login", request.url));
    if (!["admin", "content_manager"].includes(userType)) {
      return NextResponse.redirect(new URL("/blog", request.url));
    }
  }

  return NextResponse.next();
}

// Optional: Match specific paths only (improves performance)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/instructor/:path*",
    "/auth/login",
    "/auth/signup",
  ],
};
