"use server";

import z, { email } from "zod";
import { FormState, LoginFormSchema, SignupFormSchema } from "./type";
import { BACKEND_URL } from "./constants";
import { CreateUserDto, LoginDto, LoginSuccessResponseDto } from "../types/dto";
import { parseURLObject } from "zod/v4/core";
import { redirect } from "next/navigation";

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

    // TO DO: Create the session for authenticate user

    console.log({result});
  }
  else {
    return ({
      message: response.status === 401 ? 'Invalid Credentials!' : response.statusText,
    })
  }

}
