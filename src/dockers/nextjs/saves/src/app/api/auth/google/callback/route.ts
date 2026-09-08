import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../../lib/constants";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const baseURL = 'https://localhost:4333'

  const queryParams = request.nextUrl.search;
  console.log({
    message: "OAUTH inspecting to queryParam from google redirect",
    timeStamp: new Date().toISOString.toString(),
    query: queryParams
  });

  const apiPath = '/auth/google/callback'
  try {
    const res = await fetch(`${BACKEND_URL}${apiPath}${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log({res});

    if (!res.ok) {
      throw new Error(`Nest Js callback failed with status ${res.status}`);
    }

    const { accessToken, refreshToken } = await res.json();

    const cookieStore = cookies();

    (await cookieStore).set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12
    });
    (await cookieStore).set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    const response = NextResponse.redirect(new URL(`/?accessToken=${accessToken}`, baseURL));

    return response;
  } catch (error) {
    console.error('Oauth callback error', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', baseURL));
  }

}