import { zstdCompress } from "node:zlib";
import z from 'zod'

export type FormState = | {
  error?: {
    errors: string[];
    properties?: {
      displayName?: {
        errors: string[]
      },
      email?: {
        errors: string[]
      },
      password?: {
        errors: string[]
      },
    }

  };
  message?: string;
} | undefined

export const SignupFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { error: "Name must be at least 2 Characters long." })
    .trim(),
  
  email: z.email({ error: "Please enter a valid email."}).trim(),

  password: z
    .string()
    .min(8, { error: "Be at least 8 Characters long"})
    .regex(/[a-zA-Z]/, {error: "Contain at least one letter."})
    .regex(/[0-9]/, {error: 'Contain at least one number.'})
    .regex(/[^a-zA-Z0-9]/, {error: 'Contain at least one special Character.'})
    .trim(),
})
