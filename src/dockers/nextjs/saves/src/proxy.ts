import { NextRequest, NextResponse } from "next/server";
import { 
  ACCESS_TOKEN_COOKIE_EXPIRE_TIME,
  BACKEND_URL, 
  REFRESH_TOKEN_COOKIE_EXPIRE_TIME
} from "./lib/constants"
import { RefreshTokenSuccessDto } from "./types/dto";

const publicPageRoute: string[] = ['/about', '/auth'];

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow public routes
  if (publicPageRoute.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Helper function to handle unauthorized requests
  const handleUnauthorized = () => {
    if (pathname.startsWith('/api/protected/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/signin'; // Added leading slash
    redirectUrl.search = '';
    redirectUrl.searchParams.set('callbackUrl', `${pathname}${search}`);

    const response = NextResponse.redirect(redirectUrl);
    // Clear dead cookies
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  };

  // If neither token is present, reject immediately
  if (!accessToken && !refreshToken) {
    return handleUnauthorized();
  }

  // 2. Validate current accessToken if present
  if (accessToken) {
    try {
      const checkRes = await fetch(`${BACKEND_URL}/auth/check`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (checkRes.ok) {
        return NextResponse.next();
      }
    } catch {
      // Backend unreachable or network error, proceed to try refresh
    }
  }

  // 3. If accessToken is missing or invalid, attempt refresh
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

    // 4. Update the request headers so Server Components (layout/page) 
    // receive the fresh token on this same render pass
    request.cookies.set('accessToken', refreshFormatted.accessToken);
    request.cookies.set('refreshToken', refreshFormatted.refreshToken);

    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    // 5. Set the new cookies on the response for the browser
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