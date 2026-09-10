import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const publicPageRoute: string[] = ['/about', '/auth' ];

export default function proxy(request: NextRequest) {

  const { pathname, search } = request.nextUrl;
  //console.log(`what is this ${pathname}`);
  //const aboutRegex = /^\/about(-[a-z]+)?\/?$/i

  if ( publicPageRoute.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (!accessToken && !refreshToken) {

    /* /api/protected/ is the api route handler that requires
      The accessToken
     */
    if (pathname.startsWith('/api/protected/')) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname = 'auth/signin';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('callbackUrl', `${pathname}${search}`);

    return NextResponse.redirect(redirectUrl);
  }
  
  
  return NextResponse.next();
}

export const config = {
  matcher: 
        [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}