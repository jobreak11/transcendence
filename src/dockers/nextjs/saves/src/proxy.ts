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
  console.log(`[PROXY] 🔄 Redirecting (302) -> ${targetUrl.toString()}`);

  return NextResponse.redirect(targetUrl, 302);
};

export async function proxy(request: NextRequest) {
  const reqId = Math.random().toString(36).substring(2, 7).toUpperCase();
  const { pathname, search, searchParams } = request.nextUrl;

  console.log(`\n========================================`);
  console.log(`[PROXY][${reqId}] ➡️ Incoming Request: ${request.method} ${pathname}${search}`);

  // Detect if Nginx @error401 sent the user here to refresh their token
  const isAuthBridge = pathname === "/auth/bridge";
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/";

  // Prevent open-redirect attacks: only allow single-slash relative paths
  const safeCallbackUrl =
    rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/";

  console.log(`[PROXY][${reqId}] 🧭 Context:`, {
    pathname,
    search,
    isAuthBridge,
    rawCallbackUrl,
    safeCallbackUrl,
  });

  // 1. Allow public routes immediately (EXCEPT /auth/bridge which must run token refresh)
  if (
    !isAuthBridge &&
    (pathname === "/" ||
      publicPageRoute.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      ))
  ) {
    console.log(`[PROXY][${reqId}] ✅ Step 1: Public route matched (${pathname}) -> NextResponse.next()`);
    return NextResponse.next();
  }

  // 2. Skip background <Link> prefetches so parallel hovers don't race
  // on /auth/refresh or accidentally delete rotated cookies
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1";

  if (isPrefetch) {
    console.log(`[PROXY][${reqId}] ⏭️ Step 2: Prefetch detected -> NextResponse.next()`);
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  console.log(`[PROXY][${reqId}] 🍪 Cookies present:`, {
    hasAccessToken: Boolean(accessToken),
    accessTokenPreview: accessToken ? `${accessToken.slice(0, 12)}...` : null,
    hasRefreshToken: Boolean(refreshToken),
    refreshTokenPreview: refreshToken ? `${refreshToken.slice(0, 12)}...` : null,
  });

  // Check admin status if on /admin/* OR if /auth/bridge is redirecting back to /admin/*
  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    (isAuthBridge &&
      (safeCallbackUrl === "/admin" || safeCallbackUrl.startsWith("/admin/")));

  const checkEndpoint = isAdminRoute
    ? `${BACKEND_URL}/auth/admin/check`
    : `${BACKEND_URL}/auth/check`;

  console.log(`[PROXY][${reqId}] 🛡️ Route Check Config:`, {
    isAdminRoute,
    checkEndpoint,
  });

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

    console.log(`[PROXY][${reqId}] 🍪 Applying refreshed cookies to outgoing response:`, {
      newAccessTokenPreview: tokens.accessToken ? `${tokens.accessToken.slice(0, 12)}...` : null,
      newRefreshTokenPreview: tokens.refreshToken ? `${tokens.refreshToken.slice(0, 12)}...` : null,
      cookieOptions,
    });

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
    console.log(`[PROXY][${reqId}] 🔍 Calling verifyAccessToken -> GET ${checkEndpoint}`);
    try {
      const res = await fetch(checkEndpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `accessToken=${token}`,
        },
        cache: "no-store",
      });

      const cloned = res.clone();
      const bodyText = await cloned.text().catch(() => "<unreadable body>");
      console.log(`[PROXY][${reqId}] 📥 verifyAccessToken response:`, {
        status: res.status,
        ok: res.ok,
        body: bodyText,
      });

      return res;
    } catch (err) {
      console.error(`[PROXY][${reqId}] ❌ verifyAccessToken network error:`, err);
      return null;
    }
  };

  // Helper: 401 Unauthorized (Not logged in or dead session -> 302 to login)
  const handleUnauthorized = (reason: string) => {
    console.log(`[PROXY][${reqId}] 🚫 handleUnauthorized triggered! Reason: ${reason}`);

    if (pathname.startsWith("/api/protected/")) {
      console.log(`[PROXY][${reqId}] 🚫 Returning 401 JSON for /api/protected/ route`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (pathname.startsWith("/api/")) {
      console.log(`[PROXY][${reqId}] ➡️ Passing through non-protected /api/ route -> NextResponse.next()`);
      return NextResponse.next();
    }

    // Preserve original target URL (whether from Nginx bridge or normal Next.js page)
    const targetCallback = isAuthBridge ? safeCallbackUrl : `${pathname}${search}`;
    const signinRelativeUrl = `/auth/signin?callbackUrl=${encodeURIComponent(
      targetCallback
    )}`;

    console.log(`[PROXY][${reqId}] 🗑️ Deleting accessToken & refreshToken cookies and redirecting to signin: ${signinRelativeUrl}`);
    const response = createDynamicRedirect(request, signinRelativeUrl);
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");

    return response;
  };

  // Helper: 403 Forbidden (Logged in, but not authorized -> 302 to home)
  const handleForbidden = (reason: string, refreshedTokens?: RefreshTokenSuccessDto) => {
    console.log(`[PROXY][${reqId}] ⛔ handleForbidden triggered! Reason: ${reason}`, {
      hasRefreshedTokens: Boolean(refreshedTokens),
    });

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
    return handleUnauthorized("Neither accessToken nor refreshToken cookie is present");
  }

  // 3. Check current accessToken; if it fails for ANY reason (401, network error),
  // fall through to Step 4 to refresh the token first
  if (accessToken) {
    console.log(`[PROXY][${reqId}] ▶️ Step 3: Verifying existing accessToken...`);
    const initialCheck = await verifyAccessToken(accessToken);

    if (initialCheck?.ok) {
      if (isAuthBridge) {
        console.log(`[PROXY][${reqId}] ✅ Step 3: Initial check OK on /auth/bridge -> Redirecting to ${safeCallbackUrl}`);
        return createDynamicRedirect(request, safeCallbackUrl);
      }
      console.log(`[PROXY][${reqId}] ✅ Step 3: Initial check OK -> NextResponse.next()`);
      return NextResponse.next();
    }

    if (initialCheck?.status === 403) {
      return handleForbidden("Initial accessToken check returned 403 Forbidden");
    }

    console.log(`[PROXY][${reqId}] ⚠️ Step 3: Initial accessToken check did not succeed (status: ${initialCheck?.status ?? "null/network error"}). Falling through to Step 4 (refresh)...`);
  } else {
    console.log(`[PROXY][${reqId}] ℹ️ Step 3: No accessToken present. Proceeding to Step 4 (refresh)...`);
  }

  // 4. Access token missing or check failed -> attempt refresh first
  if (!refreshToken) {
    return handleUnauthorized("Access token invalid/missing and no refreshToken cookie available");
  }

  try {
    console.log(`[PROXY][${reqId}] 🔄 Step 4: Attempting token refresh -> POST ${BACKEND_URL}/auth/refresh`);
    const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    const refreshClone = refreshRes.clone();
    const refreshBodyText = await refreshClone.text().catch(() => "<unreadable body>");
    console.log(`[PROXY][${reqId}] 📥 Step 4: /auth/refresh response:`, {
      status: refreshRes.status,
      ok: refreshRes.ok,
      body: refreshBodyText,
    });

    if (!refreshRes.ok) {
      return handleUnauthorized(`/auth/refresh failed with status ${refreshRes.status}`);
    }

    const refreshedTokens: RefreshTokenSuccessDto = await refreshRes.json();
    console.log(`[PROXY][${reqId}] ✅ Step 4: Token refresh succeeded! Received new tokens.`);

    // 5. /auth/refresh already validated the user via RefreshJwtStrategy;
    // only /admin routes need a follow-up check with the new accessToken
    if (isAdminRoute) {
      console.log(`[PROXY][${reqId}] ▶️ Step 5: Admin route detected -> Verifying newly refreshed accessToken against ${checkEndpoint}`);
      const postRefreshAdminCheck = await verifyAccessToken(
        refreshedTokens.accessToken
      );

      if (!postRefreshAdminCheck) {
        return handleUnauthorized("Post-refresh admin check returned null (network error)");
      }

      if (postRefreshAdminCheck.status === 403) {
        return handleForbidden("Post-refresh admin check returned 403 Forbidden", refreshedTokens);
      }

      if (!postRefreshAdminCheck.ok) {
        return handleUnauthorized(`Post-refresh admin check failed with status ${postRefreshAdminCheck.status}`);
      }

      console.log(`[PROXY][${reqId}] ✅ Step 5: Post-refresh admin check passed!`);
    }

    // Bounced from Nginx @error401 -> attach new cookies and redirect back to /admin/dozzle/
    if (isAuthBridge) {
      console.log(`[PROXY][${reqId}] 🌉 Step 5b: /auth/bridge complete -> Redirecting to ${safeCallbackUrl} with refreshed cookies`);
      const bridgeRedirect = createDynamicRedirect(request, safeCallbackUrl);
      return applyRefreshedCookies(bridgeRedirect, refreshedTokens);
    }

    // 6. Update request cookies so Server Components receive the fresh token on this render
    console.log(`[PROXY][${reqId}] 📝 Step 6: Updating request cookies for downstream Server Components`);
    request.cookies.set("accessToken", refreshedTokens.accessToken);
    request.cookies.set("refreshToken", refreshedTokens.refreshToken);

    const response = NextResponse.next({
      request,
    });

    // 7. Set the rotated cookies on the browser response
    console.log(`[PROXY][${reqId}] ✅ Step 7: Returning NextResponse.next() with refreshed browser cookies`);
    return applyRefreshedCookies(response, refreshedTokens);
  } catch (err) {
    console.error(`[PROXY][${reqId}] ❌ Unexpected exception during Step 4-7 refresh flow:`, err);
    return handleUnauthorized("Exception thrown during token refresh flow");
  }
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
