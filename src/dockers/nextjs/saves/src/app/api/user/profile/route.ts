import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { BACKEND_URL } from "../../../../lib/constants";

export async function GET() {
  const apiPath = "/user/profile";

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

    const nestResponse = await fetch(
      `${BACKEND_URL}${apiPath}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

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
        error:
          error instanceof Error
            ? error.message
            : `Internal server error ${apiPath}`,
      },
      {
        status: 500,
      },
    );
  }
}

// Removed the unused Erica_One import.
// Removed the unused request argument.
// Changed "Unauthorize" to "Unauthorized".
// Parsed the backend response before returning it.
// Added cache: "no-store" so profiles are not accidentally cached.


// Mark
// import { NextRequest, NextResponse } from "next/server";
// import { BACKEND_URL } from "../../../../lib/constants";
// import { cookies } from "next/headers";
// import { Erica_One } from "next/font/google";


// export async function GET(request: NextRequest) {

//   const apiPath = '/user/profile';

//   try {
//     const cookieStore = await cookies();
//     const accessToken = cookieStore.get('accessToken')?.value;

//     if (!accessToken) {
//       return NextResponse.json(
//         {
//           error: 'Unauthorize'
//         },
//         {
//           status: 401
//         });
//     }


//     const res = await fetch(`${BACKEND_URL}${apiPath}`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${accessToken}`,
//         'Content-Type': 'application/json',
//       }
//     });

//     if (!res.ok) {
//       return NextResponse.json(res, { status: res.status});
//     }

//     const data = await res.json();
//     return NextResponse.json(data, { status: res.status});

//   } catch (error) {
//     return NextResponse.json({
//       error: error instanceof Error ? error.message : String(error)
//     }, {
//       status: 500
//     });
//   }
// }