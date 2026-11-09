import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../../../lib/constants";
import { cookies } from "next/headers";


const allowedPaths = new Set([

  // testing
  '/hello',

  // user api
  '/user/profile',
  '/user/profile/uploadProfilePic',
  '/user/update',
  '/user/setRole',
  '/user/create',
  '/user/delete',
  '/user',
  '/user/totalCount',


  // title api
  '/title',
  '/title/all',
  '/title/find',
  '/title/new',
  '/title/give',
  '/title/revoke',
  '/title/update',
  '/title/delete',

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
  '/game/lobby/create',
  '/game/lobby/join',
  '/game/lobby/leave',
  '/game/lobby/allRooms',
  '/game/lobby/my-lobby',
  '/game/lobby/update',
  '/game/lobby/startgame',
  '/game/lobby',


])

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }>}) {
  const resolvedParams = await params;
  const pathString = resolvedParams.path.join('/');
  if (!allowedPaths.has(`/${pathString}`)) {
    return Response.json(
      {
        error: `Not found`,
      },
      {
        status: 404
      },
    );
  }
  const searchParams = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${pathString}${searchParams}`

  console.debug(`reach passthrough targetUrl: ${targetUrl}`)

  // Pre pare headers (strip host, add auth bearer token)
  const headers = new Headers(request.headers);

  headers.delete("host"); // if not might host mismatch error on backend.

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
