import { NextResponse } from "next/server";
import { SignupFormSchema } from "../../../../lib/type";
import { error } from "node:console";
import { BACKEND_URL } from "../../../../lib/constants";
import z, { success } from "zod";
import { CreateUserDto, User } from "../../../../types/dto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = SignupFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: z.treeifyError(validation.error) },
        { status: 400 }
      );
    }

    const payload: CreateUserDto =  {
      email: validation.data.email,
      password: validation.data.password,
      displayName: validation.data.displayName
    }

    const response = await fetch(`${BACKEND_URL}/auth/signup`, {
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
          message:
            response.status === 409
              ? 'The user already exists'
              : data?.message || response.statusText,
        },
        {
          status: response.status
        }
      );
    }

    const user: User = await response.json();

    return NextResponse.json(user,
      {status: 201}
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }

  
}