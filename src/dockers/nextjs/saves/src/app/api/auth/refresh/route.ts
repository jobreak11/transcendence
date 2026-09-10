import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../lib/constants";
import { RefreshTokenSuccessDto } from "../../../../types/dto";

export async function POST(request: NextRequest) {

  const apiPath = '/auth/refresh';

  const cookieStore = await cookies();

  const refreshToken = cookieStore.get('refreshToken')?.value || '';

  // This Refresh Api requires refreshToken from the cookie
  if (!refreshToken) {

    return NextResponse.json(
      { message: 'UnAuthorized refreshToken not found from cookie'},
      { status: 401}
    )
  }

  const requestPath = `${BACKEND_URL}${apiPath}`;

  try {
    const response = await fetch(requestPath, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      },
    });


    if (response.ok) {
      const data: RefreshTokenSuccessDto = await response.json();
      return NextResponse.json(data, {status: response.status});
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    return NextResponse.json(
      typeof data === 'string' ? { message: data } : data,
      { status: response.status }
    );

  } catch (error) {

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Ínternal server error',
      },
      {
        status: 502
      }
    );
  }

}