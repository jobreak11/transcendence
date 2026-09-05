'use client';
import { useActionState } from "react";
import { SubmitButton } from "../signup/submitButton";
import { signIn } from "../../../lib/auth";
import Link from "next/link";

export function SignInForm() {

  const [state, action, isPending] = useActionState(signIn, undefined);


  return (
    <form action={action}>

      <div className="flex flex-col gap-2 w-64">
        {state?.message && <p className="text-sm text-red-500">{state.message}</p>}

        <div className="gap-2 flex">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder="m@example.com" type="email" defaultValue={state?.fields?.email} />
        </div>
        {state?.error?.properties?.email &&
        <p className="text-xs text-red-500">{state.error.properties.email.errors[0]}</p>
        }

        <div className="gap-2 flex">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="bg-black/10 rounded-2xl" />
        </div>
        {state?.error?.properties?.password &&
        <p className="text-xs text-red-500">{state.error.properties.password.errors[0]}</p>
        }

        <Link className="text-sm underline" href='#'>Forgot your password?</Link>

        <div className="flex justify-between text-sm">
          <p> Don't have an account ? </p>
          <Link className="text-sm underline" href='/auth/signup'>
          Sign Up
          </Link>

        </div>

        <SubmitButton isPending={isPending}>Sign In</SubmitButton>

      </div>

    </form>
  )
}