import { cookies } from "next/headers";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { BACKEND_URL } from "../../../../../lib/constants";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
];

const MAXIMUM_FILE_SIZE =
  5 * 1024 * 1024;

export async function POST(
  request: NextRequest,
) {
  const apiPath =
    "/user/profile/uploadProfilePic";

  try {
    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const incomingFormData =
      await request.formData();

    const file =
      incomingFormData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "No valid file was provided.",
        },
        { status: 400 },
      );
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only JPG, JPEG and PNG files are supported.",
        },
        { status: 400 },
      );
    }

    if (
      file.size > MAXIMUM_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "The image must be smaller than 5 MB.",
        },
        { status: 400 },
      );
    }

    console.log(
      "Forwarding profile image:",
      {
        name: file.name,
        type: file.type,
        size: file.size,
      },
    );

    const nestFormData =
      new FormData();

    nestFormData.append(
      "file",
      file,
      file.name,
    );

    const nestResponse = await fetch(
      `${BACKEND_URL}${apiPath}`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        body: nestFormData,
        cache: "no-store",
      },
    );

    const responseText =
      await nestResponse.text();

    console.log(
      "NestJS upload response:",
      {
        status: nestResponse.status,
        body: responseText,
      },
    );

    if (
      nestResponse.status === 204
    ) {
      return new NextResponse(null, {
        status: 204,
      });
    }

    let responseData: unknown;

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : {
            message:
              "Profile picture uploaded.",
          };
    } catch {
      responseData = {
        message:
          responseText ||
          "Profile picture uploaded.",
      };
    }

    return NextResponse.json(
      responseData,
      {
        status:
          nestResponse.status,
      },
    );
  } catch (error) {
    console.error(
      "Profile upload proxy error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : `Internal server error ${apiPath}`,
      },
      { status: 500 },
    );
  }
}

/// Before ///

// import { cookies } from "next/headers";
// import { NextRequest, NextResponse } from "next/server";
// import { BACKEND_URL } from "../../../../../lib/constants";

// export async function POST(request: NextRequest) {
//   const apiPath = '/user/profile/uploadProfilePic';
//   try {

//     const formData = await request.formData();
//     const file = formData.get('file') as File | null;

//     if (!file) {
//       return NextResponse.json({error: 'No file provided'}, { status: 400});
//     }


//     const nestFormData = new FormData();
//     nestFormData.append('file', file);

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

//     const nestResponse = await fetch(`${BACKEND_URL}${apiPath}`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${accessToken}`,
//       },
//       body: nestFormData,
//     });

//     const data = await nestResponse.json();

//     return NextResponse.json(data, {status: nestResponse.status});
//   } catch (error) {
//     return NextResponse.json({error: `Internal server error ${apiPath}`},
//       { status: 500}
//     );
//   }
// }