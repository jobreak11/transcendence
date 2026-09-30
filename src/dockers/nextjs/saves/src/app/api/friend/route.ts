import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../../../lib/constants";


export async function GET(request: NextRequest) {

  const apiPath = '/friend';

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Unauthorize'
        },
        {
          status: 401
        });
    }


    const res = await fetch(`${BACKEND_URL}${apiPath}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      return NextResponse.json(res, { status: res.status});
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status});

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, {
      status: 500
    });
  }
}