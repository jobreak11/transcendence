import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_EXPIRE_TIME,
  BACKEND_URL,
  REFRESH_TOKEN_COOKIE_EXPIRE_TIME,
} from "./lib/constants";
import { RefreshTokenSuccessDto } from "./types/dto";

const publicPageRoute: string[] = ["/about", "/auth"];

// Helper: Build a 302 redirect dynamically from Nginx forwarded headers (no hardcoded host/port)
const createDynamicRedirect = (
  request: NextRequest,
  relativePath: string
): NextResponse => {
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    request.nextUrl.protocol.replace(":", "") ||
    "https";
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;

  const targetUrl = new URL(relativePath, `${proto}://${host}`);
  return NextResponse.redirect(targetUrl, 302);
};

export default async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  // Detect if Nginx @error401 sent the user here to refresh their token
  const isAuthBridge = pathname === "/auth/bridge";
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/";
  // Prevent open-redirect attacks: only allow single-slash relative paths
  const safeCallbackUrl =
    rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/";

  // 1. Allow public routes immediately (EXCEPT /auth/bridge which must run token refresh)
  if (
    !isAuthBridge &&
    (pathname === "/" ||
      publicPageRoute.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      ))
  ) {
    return NextResponse.next();
  }

  // 2. Skip background <Link> prefetches so parallel hovers don't race
  // on /auth/refresh or accidentally delete rotated cookies
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1";

  if (isPrefetch) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Check admin status if on /admin/* OR if /auth/bridge is redirecting back to /admin/*
  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    (isAuthBridge &&
      (safeCallbackUrl === "/admin" || safeCallbackUrl.startsWith("/admin/")));

  const checkEndpoint = isAdminRoute
    ? `${BACKEND_URL}/auth/admin/check`
    : `${BACKEND_URL}/auth/check`;

  // Helper: Persist rotated tokens onto any outgoing browser response
  const applyRefreshedCookies = (
    response: NextResponse,
    tokens: RefreshTokenSuccessDto
  ) => {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    response.cookies.set("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_COOKIE_EXPIRE_TIME,
    });

    response.cookies.set("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRE_TIME,
    });

    return response;
  };

  // Helper: Verify an accessToken against /auth/check or /auth/admin/check
  const verifyAccessToken = async (token: string): Promise<Response | null> => {
    try {
      return await fetch(checkEndpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      return null;
    }
  };

  // Helper: 401 Unauthorized (Not logged in or dead session -> 302 to login)
  const handleUnauthorized = () => {
    if (pathname.startsWith("/api/protected/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // Preserve original target URL (whether from Nginx bridge or normal Next.js page)
    const targetCallback = isAuthBridge ? safeCallbackUrl : `${pathname}${search}`;
    const signinRelativeUrl = `/auth/signin?callbackUrl=${encodeURIComponent(
      targetCallback
    )}`;

    const response = createDynamicRedirect(request, signinRelativeUrl);
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");

    return response;
  };

  // Helper: 403 Forbidden (Logged in, but not authorized -> 302 to home)
  const handleForbidden = (refreshedTokens?: RefreshTokenSuccessDto) => {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
      : createDynamicRedirect(request, "/"); // Change to '/unauthorized' if you have a custom 403 page

    // Keep newly rotated tokens even on 403 (including /api/ JSON responses)
    if (refreshedTokens) {
      applyRefreshedCookies(response, refreshedTokens);
    }

    return response;
  };

  // Reject immediately if neither token is present
  if (!accessToken && !refreshToken) {
    return handleUnauthorized();
  }

  // 3. Check current accessToken; if it fails for ANY reason (401, 403, network error),
  // fall through to Step 4 to refresh the token first
  if (accessToken) {
    const initialCheck = await verifyAccessToken(accessToken);
    if (initialCheck?.ok) {
      if (isAuthBridge) {
        return createDynamicRedirect(request, safeCallbackUrl);
      }
      return NextResponse.next();
    }
  }

  // 4. Access token missing or check failed -> attempt refresh first
  if (!refreshToken) {
    return handleUnauthorized();
  }

  try {
    const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!refreshRes.ok) {
      return handleUnauthorized();
    }

    const refreshedTokens: RefreshTokenSuccessDto = await refreshRes.json();

    // 5. /auth/refresh already validated the user via RefreshJwtStrategy;
    // only /admin routes need a follow-up check with the new accessToken
    if (isAdminRoute) {
      const postRefreshAdminCheck = await verifyAccessToken(
        refreshedTokens.accessToken
      );

      if (!postRefreshAdminCheck) {
        return handleUnauthorized();
      }
      if (postRefreshAdminCheck.status === 403) {
        return handleForbidden(refreshedTokens);
      }
      if (!postRefreshAdminCheck.ok) {
        return handleUnauthorized();
      }
    }

    // Bounced from Nginx @error401 -> attach new cookies and redirect back to /admin/dozzle/
    if (isAuthBridge) {
      const bridgeRedirect = createDynamicRedirect(request, safeCallbackUrl);
      return applyRefreshedCookies(bridgeRedirect, refreshedTokens);
    }

    // 6. Update request cookies so Server Components receive the fresh token on this render
    request.cookies.set("accessToken", refreshedTokens.accessToken);
    request.cookies.set("refreshToken", refreshedTokens.refreshToken);

    const response = NextResponse.next({
      request,
    });

    // 7. Set the rotated cookies on the browser response
    return applyRefreshedCookies(response, refreshedTokens);
  } catch {
    return handleUnauthorized();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
