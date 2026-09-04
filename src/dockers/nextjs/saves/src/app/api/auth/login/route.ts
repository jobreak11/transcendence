import z, { json } from "zod";
import { LoginFormSchema } from "../../../../lib/type";
import { NextResponse } from "next/server";
import { error } from "node:console";
import { LoginDto, LoginSuccessResponseDto } from "../../../../types/dto";
import { BACKEND_URL } from "../../../../lib/constants";

export async function POST(request: Request){

  try {
    const body = await request.json();
    const validation = LoginFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: z.treeifyError(validation.error) },
        { status: 400 }
      );
    }

    const payload: LoginDto = {
      email: validation.data.email,
      password: validation.data.password,
    }

    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: response.statusText
        },
        {
          status: response.status
        }
      );
    }

    const loginSuccessData: LoginSuccessResponseDto = await response.json();

    return NextResponse.json(loginSuccessData,
      {status: response.status}
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}