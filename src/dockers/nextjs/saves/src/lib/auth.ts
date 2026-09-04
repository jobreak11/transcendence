'use server';

import z from "zod";
import { FormState, SignupFormSchema } from "./type";
import { BACKEND_URL } from "./constants";
import { redirect } from "next/navigation";

export async function signUp(state: FormState, formData: FormData)
: Promise<FormState> {
  const validationFields = SignupFormSchema.safeParse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validationFields.success) {
    return ({
      error: z.treeifyError(validationFields.error),
    });
  }

  const response = await fetch(`${BACKEND_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validationFields.data),
  })

  if (response.ok) {
    redirect('/auth/signin');
  }
  else {
    return ({
      message: response.status === 409 ? "The user is already existed!" : response.statusText
    })
  }
  
}