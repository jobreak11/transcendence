"use server";

import z, { email } from "zod";
import { FormState, LoginFormSchema, SignupFormSchema } from "./type";
import { BACKEND_URL } from "./constants";
import { CreateUserDto, LoginDto, LoginSuccessResponseDto } from "../types/dto";
import { parseURLObject } from "zod/v4/core";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function Signup(state: FormState, formData: FormData ): Promise<FormState> {

  const delay = await new Promise((resolve) => setTimeout(resolve, 3000));

  const fields = {
    displayName: formData.get('displayName')?.toString() ?? '',
    email: formData.get('email')?.toString() ?? '',
  };

  const validationFields = SignupFormSchema.safeParse({
    ...fields,
    password: formData.get('password'),
  });

  if (!validationFields.success) {
    return {
      error: z.treeifyError(validationFields.error),
      fields,
    };
  }

  const payload: CreateUserDto = validationFields.data;

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.log(`Failed to connect to backend: ${BACKEND_URL}`, error);
    return ({
      message: "failed to connect to backend service",
    })
  }

  if (response.ok) {
    redirect('/auth/signin');
  }
  else {
    return ({
      message: response.status === 409 ? 'The user is already exist!' : response.statusText
    })
  }

}

export async function signIn(state: FormState, formData: FormData): Promise<FormState> {

  const delay = await new Promise((resolve) => setTimeout(resolve, 3000));

  const requestPath = `${BACKEND_URL}/auth/login`;

  const fields = {
    email: formData.get('email')?.toString() ?? '',
  };

  const validationFields = LoginFormSchema.safeParse({
    ...fields,
    password: formData.get('password'),
  });

  if (!validationFields.success) {
    return ({
      error: z.treeifyError(validationFields.error),
      fields,
    });
  }

  let response: Response;

  const payload: LoginDto = validationFields.data;

  try {
    response  = await fetch(`${requestPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

  } catch (error) {
    console.log (`Failed to connect to backend ${requestPath}`, error);
    return ({
      message: 'failed to connect to backend service',
    })
  }

  if (response.ok) {
    let result: LoginSuccessResponseDto;
    try {
      result = (await response.json()) as LoginSuccessResponseDto;
    } catch (error) {
      console.log(`Failed to parse JSON from ${requestPath}`, error);
      return ({
        message: 'failed on parsing data from backend',
      })
    }

    const accessToken = result.accessToken;
    const refreshToken = result.refreshToken;

    if (accessToken) {
      const cookieStore = await cookies();
      cookieStore.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 1,
      });
      cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 1,
      });
      redirect('/');
  }
  }
  
  else {
    return ({
      message: response.status === 401 ? 'Email or password is wrong' : response.statusText,
      fields,
    })
  }

}

export async function signOut() {
  const cookieStore = await cookies();
  
  cookieStore.delete('token');
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
  redirect('/auth/signin');
}