import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../lib/constants";
import { Noto_Sans_Tamil_Supplement } from "next/font/google";

export async function POST(request: Request) {

  const apiPath = '/api/signout'
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value || '';
  const clearAuthCookies = () => {
    cookieStore.delete('accessToken'),
    cookieStore.delete('refreshToken')
  };

  if (!accessToken) {
    clearAuthCookies();
    return new NextResponse(null, {status: 204});
  }

  const requestPath = `${BACKEND_URL}${apiPath}`
  
  try {

    const response = await fetch(requestPath, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      cache: 'no-store'
    });

    if (!response.ok)
      console.warn(`Backend signout returned status ${response.status}`);

  } catch (error) {
    console.error("Signout Network Error", error);
  } finally {
    clearAuthCookies();
  }

  return new NextResponse(null, {status: 204});
}