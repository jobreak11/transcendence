import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_EXPIRE_TIME,
  BACKEND_URL,
  REFRESH_TOKEN_COOKIE_EXPIRE_TIME,
} from "./lib/constants";
import { RefreshTokenSuccessDto } from "./types/dto";

const publicPageRoute: string[] = ["/about", "/auth"];

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow public routes immediately
  if (
    pathname === "/" ||
    publicPageRoute.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
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
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

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

  // Helper: 401 Unauthorized (Not logged in or dead session -> redirect to login)
  const handleUnauthorized = () => {
    if (pathname.startsWith("/api/protected/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/signin";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  };

  // Helper: 403 Forbidden (Logged in, but not authorized -> redirect to home)
  const handleForbidden = (refreshedTokens?: RefreshTokenSuccessDto) => {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
      : (() => {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/"; // Change to '/unauthorized' if you have a custom 403 page
          redirectUrl.search = "";
          return NextResponse.redirect(redirectUrl);
        })();

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
      headers: { Authorization: `Bearer ${refreshToken}` },
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
