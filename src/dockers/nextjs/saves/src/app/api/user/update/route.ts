import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { BACKEND_URL } from "../../../../lib/constants";


// PATCH /api/user/update
// PATCH /user/update

export async function PATCH(
  request: NextRequest,
) {
  const apiPath = "/user/update";

  try {
    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body",
        },
        {
          status: 400,
        },
      );
    }

    const nestResponse = await fetch(
      `${BACKEND_URL}${apiPath}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
        cache: "no-store",
      },
    );

    if (nestResponse.status === 204) {
      return new NextResponse(null, {
        status: 204,
      });
    }

    const data = await nestResponse
      .json()
      .catch(() => ({
        error: "Backend returned an invalid response",
      }));

    return NextResponse.json(data, {
      status: nestResponse.status,
    });
  } catch (error) {
    console.error(
      `Internal server error ${apiPath}:`,
      error,
    );

    return NextResponse.json(
      {
        error: `Internal server error ${apiPath}`,
      },
      {
        status: 500,
      },
    );
  }
}