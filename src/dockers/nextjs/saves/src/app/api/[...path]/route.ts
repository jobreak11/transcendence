import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_EXPIRE_TIME, BACKEND_URL, REFRESH_TOKEN_COOKIE_EXPIRE_TIME } from "../../../lib/constants";
import { cookies } from "next/headers";


const allowedPaths = new Set([

  // testing
  '/hello',

  // user api
  '/user/profile',
  '/user/profile/uploadProfilePic',
  '/user/update',
  '/user/dev/setRole',
  '/user/dev/create',
  '/user/dev/delete',
  '/user/dev',
  '/user/dev/totalCount',


  // title api
  '/title',
  '/title/all',
  '/title/find',
  '/title/new',
  '/title/give',
  '/title/revoke',
  '/title/update',
  '/title/delete',

  // throphies api
  '/trophies',
  '/trophies/totalUserCount',
  '/trophies/allTotalCount',
  '/trophies/find',
  '/trophies/dev/all',
  '/trophies/dev/create',
  '/trophies/dev/uploadPic',
  '/trophies/dev/update',
  '/trophies/dev/give',
  '/trophies/dev/revoke',
  '/trophies/dev/delete',



  // achievements api
  '/achievements',
  '/achievements/totalUserCount',
  '/achievements/allTotalCount',
  '/achievements/find',
  '/achievements/dev/all',
  '/achievements/dev/create',
  '/achievements/dev/update',
  '/achievements/dev/give',
  '/achievements/dev/revoke',
  '/achievements/dev/delete',

  // api request for admin and developer
  '/users-api',
  '/users-api/request-new',
  '/users-api/totalUserApiCount',
  '/users-api/revoke',
  '/users-api/remove',
  '/users-api/find',
  '/users-api/dev/admin/all',
  '/users-api/dev/admin/allApiCount',
  '/users-api/dev/admin/delete',
  '/users-api/dev/admin/find',

  //auth api
  '/auth/check',
  '/auth/admin/check',
  '/auth/signup',
  '/auth/login',
  '/auth/refresh',
  '/auth/signout',
  '/auth/google/login',
  '/auth/google/callback',
  '/auth/42/login',
  '/auth/42/callback',

  // chat api
  '/chat',
  '/chat/dm',
  '/chat/message',
  '/chat/room/create',
  '/chat/room/invite',
  '/chat/room/leave',
  '/chat/room/kick',

  // public chat api
  '/chat/public',

  // friendships api
  '/friend',
  '/friend/request',
  '/friend/accept',
  '/friend/reject',
  '/friend/block',

  // lobby api
  '/game/lobby/formats',
  '/game/lobby/create',
  '/game/lobby/join',
  '/game/lobby/swap-role',
  '/game/lobby/leave',
  '/game/lobby/allRooms',
  '/game/lobby/my-lobby',
  '/game/lobby/update',
  '/game/lobby/startgame',
  '/game/lobby/members',
  '/game/lobby',
  '/game/matches',
  '/game/statistics',
  '/game/statistics/find',
  '/game/statistics/findRankIndex',
  '/tournament',
])

function getForwardedHeaders(request: NextRequest): Record<string, string> {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const forwardedProto =
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(':', '') ||
    'https';

  return {
    'x-forwarded-host': forwardedHost,
    'x-forwarded-proto': forwardedProto,
  };
}

function getRequestOrigin(request: NextRequest): string {
  const { 'x-forwarded-host': host, 'x-forwarded-proto': proto } = getForwardedHeaders(request);
  if (host) {
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

async function handleOAuthLogin(
  request: NextRequest,
  apiStartPath: string,
) {

    const queryParams = request.nextUrl.searchParams;
    const callbackUrl = queryParams.get('callbackUrl') || "";
    const apiPath = `${apiStartPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`

    try {

      const res = await fetch(`${BACKEND_URL}${apiPath}`,
        {
          redirect: 'manual',
          headers: {
            ...getForwardedHeaders(request)
          }
        }
      );

      let targetUrl = res.headers.get('location');

      if (!targetUrl && res.url.includes('accounts.google.com')) {
        targetUrl = res.url
      }

      if (!targetUrl) {
        throw new Error('No Redirect URL found from backend')
      }

      return NextResponse.redirect(targetUrl);

    }
    catch (error) {
      console.error('OAuth init error:', error);

      return NextResponse.json({
        message: `failed to fetch from backend ${apiPath}`,
        error: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }

  
}

async function handleOAuthCallback(
  request: NextRequest,
  startApiPath: string

) {
    const queryParams = request.nextUrl.search;
    const origin = getRequestOrigin(request);

    try {

      const res = await fetch(`${BACKEND_URL}${startApiPath}${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getForwardedHeaders(request)
        },
      });

      if (!res.ok) {
        throw new Error(`Nest Js callback failed with status ${res.status}`);
      }

      const { accessToken, refreshToken, callbackUrl } = await res.json();

      // const strCallbackUrl: string = callbackUrl ?? '/';
      const strCallbackUrl: string = '/profile';
      const safeCallbackUrl = (!strCallbackUrl.startsWith('//') && strCallbackUrl.startsWith('/')) ? strCallbackUrl : '/';

      const response = NextResponse.redirect(new URL(safeCallbackUrl, origin));

      response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ACCESS_TOKEN_COOKIE_EXPIRE_TIME
      })


      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_COOKIE_EXPIRE_TIME
      })

      // const cookieStore = cookies();

      // (await cookieStore).set('accessToken', accessToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'lax',
      //   maxAge: ACCESS_TOKEN_COOKIE_EXPIRE_TIME
      // });

      // (await cookieStore).set('refreshToken', refreshToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'lax',
      //   maxAge: REFRESH_TOKEN_COOKIE_EXPIRE_TIME
      // });



      return response;
    }
    catch ( error) {
      console.error('Oauth callback error', error);
      return NextResponse.redirect(new URL('/auth/signin?error=oauth_failed', origin))

    }
}
const tournamentPathPattern =
  /^tournament(?:\/[0-9a-f-]{36}(?:\/(?:register|close-registration))?)?$/i;

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }>}) {
  const resolvedParams = await params;
  const pathString = resolvedParams.path.join('/');
  if (!allowedPaths.has(`/${pathString}`) && !tournamentPathPattern.test(pathString)) {
    return Response.json(
      {
        error: `Not found`,
      },
      {
        status: 404
      },
    );
  }

  if (pathString.startsWith('auth/42/login')) {
    return handleOAuthLogin(request, '/auth/42/login');
  }
  else if (pathString.startsWith('auth/42/callback')) {
    return handleOAuthCallback(request, '/auth/42/callback');
  }
  else if (pathString.startsWith('auth/google/login')) {
    return handleOAuthLogin(request, '/auth/google/login');
  }
  else if (pathString.startsWith('auth/google/callback')) {
    return handleOAuthCallback(request, '/auth/google/callback');
  }


  const searchParams = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${pathString}${searchParams}`

  // Pre pare headers (strip host, add auth bearer token)
  const headers = new Headers(request.headers);

  headers.delete("host"); // if not might host mismatch error on backend.
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  headers.set('x-forwarded-host', forwardedHost);
  headers.set('x-forwarded-proto', forwardedProto);

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // attach the accessToken if client has it
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let body: BodyInit | undefined = undefined;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    // blob is one of the core type included in the BodyInit union definition
    body = await request.blob();
  }

  try {

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // @ts-ignore
      duplex: 'half'
    });

    const responseHeaders = new Headers(backendResponse.headers);

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('Proxy passthrough error:', error);
    return NextResponse.json(
      {
        error: "Internal Server Error in API Gateway"
      },
      {
        status: 500
      }
    );
  }

}

export {
  handleRequest as GET,
  handleRequest as HEAD,
  handleRequest as POST,
  handleRequest as PUT,
  handleRequest as PATCH,
  handleRequest as DELETE,
}
