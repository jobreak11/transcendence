import { cookies } from "next/headers"
import React from "react"
import { MainSocketProvider } from "./_context/useMainSocket";
import { ACCESS_TOKEN_COOKIE_EXPIRE_TIME, BACKEND_URL, REFRESH_TOKEN_COOKIE_EXPIRE_TIME } from "../../lib/constants";
import { redirect } from "next/navigation";
import { RefreshTokenSuccessDto } from "../../types/dto";

export default  async function layout({
  children
}: {
  children: React.ReactNode
}) {

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value ?? '';

  const res = await fetch(`${BACKEND_URL}/auth/check`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  if (!res.ok) {
    // should redirect to signin page

    // perform the refresh token 
    const refreshToken = cookieStore.get('refreshToken')?.value ?? '';

    const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refreshToken}`
      }
    })

    if (!refreshRes.ok) {
      redirect('/auth/signin');
    }

    const refreshFormatted: RefreshTokenSuccessDto = (await refreshRes.json()) as RefreshTokenSuccessDto;

    if (accessToken) {
      cookieStore.set('accessToken', refreshFormatted.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_COOKIE_EXPIRE_TIME, // Max age for cookie is in seconds
      });
    }

    if (refreshToken) {
      cookieStore.set('refreshToken', refreshFormatted.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: REFRESH_TOKEN_COOKIE_EXPIRE_TIME, // Max age for cookie is in seconds
      });

    }

  }

  return (
    <main>
      <MainSocketProvider accessToken={accessToken}>
        {children}
      </MainSocketProvider>
    </main>
  )
}