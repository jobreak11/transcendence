import { NextRequest, NextResponse } from "next/server";
import { 
  ACCESS_TOKEN_COOKIE_EXPIRE_TIME,
  BACKEND_URL, 
  REFRESH_TOKEN_COOKIE_EXPIRE_TIME
} from "./lib/constants";
import { RefreshTokenSuccessDto } from "./types/dto";

const publicPageRoute: string[] = ['/about', '/auth'];

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow public routes
  if (publicPageRoute.some((route) => pathname === route || pathname.startsWith(`${route}/`)) || pathname === '/') {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  // Helper: 401 Unauthorized (Not logged in or dead session -> redirect to login)
  const handleUnauthorized = () => {
    if (pathname.startsWith('/api/protected/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/signin';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('callbackUrl', `${pathname}${search}`);

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  };

  // Helper: 403 Forbidden (Logged in, but not an admin -> redirect to home)
  const handleForbidden = (refreshedTokens?: RefreshTokenSuccessDto) => {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/'; // Change to '/unauthorized' if you have a custom 403 page
    redirectUrl.search = '';

    const response = NextResponse.redirect(redirectUrl);

    // Keep newly refreshed tokens if they refreshed right before failing the admin check
    if (refreshedTokens) {
      response.cookies.set('accessToken', refreshedTokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_COOKIE_EXPIRE_TIME,
      });
      response.cookies.set('refreshToken', refreshedTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: REFRESH_TOKEN_COOKIE_EXPIRE_TIME,
      });
    }

    return response;
  };

  // If neither token is present, reject immediately
  if (!accessToken && !refreshToken) {
    return handleUnauthorized();
  }

  let isAdmin: boolean = false;

  // 2. Validate current accessToken if present
  if (accessToken) {
    try {
      // Hit /auth/admin/check directly for /admin routes, or /auth/check for normal routes
      const checkEndpoint = isAdminRoute 
        ? `${BACKEND_URL}/auth/admin/check` 
        : `${BACKEND_URL}/auth/check`;

      const checkRes = await fetch(checkEndpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      // 204 No Content (or any 2xx) means valid
      if (checkRes.status === 204 || checkRes.ok) {
        if (isAdminRoute) isAdmin = true;
        return NextResponse.next();
      }

      // If /auth/admin/check returns 403, the token is valid, but user is NOT an admin
      // No need to waste a call refreshing the token — reject immediately
      if (isAdminRoute && checkRes.status === 403) {
        return handleForbidden();
      }

      // If status is 401, fall through to Step 3 to attempt a token refresh
    } catch {
      // Backend unreachable or network error, proceed to try refresh
    }
  }

  // 3. If accessToken is missing or expired (401), attempt refresh
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

    const refreshFormatted: RefreshTokenSuccessDto = await refreshRes.json();

    // 4. If on an /admin route, verify admin status with the NEW accessToken
    if (isAdminRoute) {
      const adminRes = await fetch(`${BACKEND_URL}/auth/admin/check`, {
        method: "GET",
        headers: { Authorization: `Bearer ${refreshFormatted.accessToken}` },
        cache: "no-store",
      });

      isAdmin = adminRes.status === 204 || adminRes.ok;

      if (!isAdmin) {
        return handleForbidden(refreshFormatted);
      }
    }

    // 5. Update request cookies so Server Components receive the fresh token on this render
    request.cookies.set('accessToken', refreshFormatted.accessToken);
    request.cookies.set('refreshToken', refreshFormatted.refreshToken);

    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    // 6. Set the new cookies on the response for the browser
    response.cookies.set('accessToken', refreshFormatted.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_COOKIE_EXPIRE_TIME,
    });

    response.cookies.set('refreshToken', refreshFormatted.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRE_TIME,
    });

    return response;

  } catch {
    return handleUnauthorized();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
