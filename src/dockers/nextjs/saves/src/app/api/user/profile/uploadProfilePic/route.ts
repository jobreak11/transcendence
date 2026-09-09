import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../../lib/constants";

export async function POST(request: NextRequest) {
  const apiPath = '/user/profile/uploadProfilePic';
  try {

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({error: 'No file provided'}, { status: 400});
    }


    const nestFormData = new FormData();
    nestFormData.append('file', file);

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

    const nestResponse = await fetch(`${BACKEND_URL}${apiPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: nestFormData,
    });

    const data = await nestResponse.json();

    return NextResponse.json(data, {status: nestResponse.status});
  } catch (error) {
    return NextResponse.json({error: `Internal server error ${apiPath}`},
      { status: 500}
    );
  }
}