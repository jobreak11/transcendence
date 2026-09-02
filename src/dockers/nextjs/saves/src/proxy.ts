import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {

  const { pathname } = request.nextUrl;
  console.log(`what is this ${pathname}`);
  //const aboutRegex = /^\/about(-[a-z]+)?\/?$/i

  if ( pathname.startsWith('/about') === true)
    return NextResponse.redirect(new URL('/', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: 
        [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}