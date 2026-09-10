import { NextRequest, NextResponse } from "next/server";
import { LoginDto, LoginSuccessResponseDto } from "../../../../types/dto";
import { LoginFormSchema } from "../../../../lib/type";
import z from "zod";
import { BACKEND_URL } from "../../../../lib/constants";

export async function POST(request: NextRequest) {

  const apiPath = '/auth/login';

  let body: any;
  try {
    body = (await request.json());
  } catch(error) {

    console.error({ error });
    return NextResponse.json(
      { message: 'Invalid JSON payload'},
      { status: 400}
    );

  }

  const validation = LoginFormSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: z.treeifyError(validation.error)},
      { status: 400 }
    );
  }

  const payload: LoginDto = validation.data;

  const requestPath = `${BACKEND_URL}${apiPath}`;

  try {
    const response = await fetch(requestPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {

      const data: LoginSuccessResponseDto = await response.json();
      return NextResponse.json(data, {status: response.status});
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    return NextResponse.json(
      typeof data === 'string' ? { message: data } : data,
      { status: response.status }
    );
  } catch (error) {
    console.error(`Failed to connect to backend ${requestPath}`, error);
    return NextResponse.json(
      { message: 'Failed to connect to backend service'},
      { status: 502 }
    );

  }

}