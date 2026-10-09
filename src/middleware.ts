import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight, edge-compatible JWT decoder (no Node.js crypto/buffer required in Edge middleware)
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Public marketing surface (crawlable, no auth): landing, about us,
// legal pages and contact. Everything else stays behind tenant auth.
const PUBLIC_MARKETING_PATHS = new Set([
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/404",
  "/500",
  "/not-found",
]);

// Known top-level standard dashboard routes
const PROTECTED_ROOT_ROUTES = new Set([
  "exec",
  "projects",
  "teams",
  "people",
  "sales",
  "revenue",
  "growth",
  "diagrams",
  "my-work",
  "dev",
  "docs",
  "lists",
  "projecthelpdemo",
  "chat",
  "whiteboards",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bypass static assets and system internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // 2. Allow all `/auth` routes to pass (root login, signup, forgot password, etc.)
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // 2b. Public marketing pages pass through (landing, about, legal, contact)
  if (PUBLIC_MARKETING_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";

  // 3. Handle dedicated organization login portal: /:orgId/auth/login
  if (segments.length >= 3 && segments[1] === "auth" && segments[2] === "login") {
    return NextResponse.next();
  }

  // Extract auth token
  const token = req.cookies.get("auth_token")?.value;
  const decoded = token ? decodeJwtPayload(token) : null;
  const isTokenValid = Boolean(decoded && decoded.userId);

  // 4. Handle tenant-prefixed routes: /:orgId/:subRoute*
  // If first segment is NOT one of the protected root routes and is NOT "auth":
  if (firstSegment && !PROTECTED_ROOT_ROUTES.has(firstSegment) && firstSegment !== "auth") {
    const orgId = firstSegment;
    const subPath = segments.slice(1).join("/");

    // Unauthenticated access to tenant workspace: redirect immediately to dedicated org login
    if (!isTokenValid) {
      const loginUrl = new URL(`/${orgId}/auth/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }

    const userOrgCode = decoded.companyCode ? decoded.companyCode.toUpperCase() : null;
    const userCompanyId = decoded.companyId;
    const isSuperuser = (decoded.role || "").toLowerCase() === "superuser";
    const isMatch =
      isSuperuser ||
      (userOrgCode && userOrgCode === orgId.toUpperCase()) ||
      (userCompanyId && userCompanyId === orgId);

    // Cross-tenant boundary check: If authenticated user tries to access a different org's URL
    if (!isMatch) {
      // Redirect to their own company's dashboard to prevent cross-tenant data breach
      const redirectOrg = userOrgCode || userCompanyId || "auth";
      const targetUrl = new URL(`/${redirectOrg}/exec/dashboard`, req.url);
      return NextResponse.redirect(targetUrl);
    }

    // Tenant boundary validated! Rewrite internally to the real page while preserving the orgId in browser URL
    const targetPath = subPath ? `/${subPath}` : "/exec/dashboard";
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-tenant-org-code", orgId);
    requestHeaders.set("x-tenant-user-id", decoded.userId);
    requestHeaders.set("x-tenant-user-role", decoded.role);

    return NextResponse.rewrite(new URL(targetPath, req.url), {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 5. Handle direct root dashboard routes: /exec, /projects, /teams, /sales, etc.
  if (PROTECTED_ROOT_ROUTES.has(firstSegment)) {
    // If not authenticated, redirect by default to login first
    if (!isTokenValid) {
      const loginUrl = new URL("/auth/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated and has companyCode, attach the organization code to the URL!
    if (decoded.companyCode) {
      const orgScopedUrl = new URL(`/${decoded.companyCode}${pathname}`, req.url);
      return NextResponse.redirect(orgScopedUrl);
    }

    // Authenticated superuser or user without companyCode: allow direct route access
    return NextResponse.next();
  }

  // 6. Catch-all: Any other unauthenticated route that is not public marketing or auth
  if (!isTokenValid) {
    const loginUrl = new URL("/auth/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (/api/*)
     * - public files (frappe-gantt.css, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|frappe-gantt.css).*)",
  ],
};
