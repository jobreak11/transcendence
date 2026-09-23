import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../lib/constants";

export async function POST(request: NextRequest) {
  try {
    const queryString = request.nextUrl.search;
    const apiPath = '/chat/dm'
    const rawBody = await request.text();
    const headers: Record<string,string> = {};
    if (rawBody)
      headers["Content-Type"] = "application/json";

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Unauthorize'
        },
        {
          status: 401
        }
      );
    }
    headers['Authorization'] = `Bearer ${accessToken}`;
    const nestResponse = await fetch(`${BACKEND_URL}${apiPath}${queryString}`, {
      method: "POST",
      headers,
      body: rawBody ? rawBody : undefined,
      cache: "no-store"
    });
    const data = await nestResponse.json();
    return NextResponse.json(data, {status: nestResponse.status});
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, {
      status: 500
    });
  }
} 
