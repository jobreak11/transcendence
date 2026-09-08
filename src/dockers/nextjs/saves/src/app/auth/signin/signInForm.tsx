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

        <div className="w-full flex items-center justify-between gap-3">
          <label htmlFor="email" className="text-white text-sm whitespace-nowrap">Email:</label>
          <input id="email" name="email" placeholder="name@example.com" type="email" defaultValue={state?.fields?.email}
          className="flex-1 min-w-0 bg-[#2a2a2a] text-white border border-[#666] rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-400" />
        </div>
        {state?.error?.properties?.email &&
        <p className="text-xs text-red-500">{state.error.properties.email.errors[0]}</p>
        }

        <div className="w-full flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-white text-sm whitespace-nowrap">Password:</label>
          <input id="password" name="password" placeholder="••••••••" type="password" className="bg-black/10 rounded-2xl" 
          className="flex-1 min-w-0 bg-[#2a2a2a] text-white border border-[#666] rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-400"/>
        </div>
        {state?.error?.properties?.password &&
        <p className="text-xs text-red-500">{state.error.properties.password.errors[0]}</p>
        }
        {state?.message && <p className="text-sm text-red-500">{state.message}</p>}

        <div className="pt-2 flex items-center justify-center w-full gap-2">
        <SubmitButton isPending={isPending}>Login</SubmitButton>
        <span>or</span>
        <Link className="text-sm underline" href='/auth/signup'>
            Sign Up?
        </Link>
        </div>

        <div className="pt-2 flex items-center justify-center w-full gap-2">
          <button type="button" 
          className="bg-black hover:bg-cyan-500 hover:text-black hover:border-cyan-500 font-bold rounded-md px-4 py-1.5 cursor-pointer disabled:opacity-50">
            Continue with 42</button>
          </div>
          <div className="pt-2 flex items-center justify-center w-full gap-2">
          <button type="button" 
          className="bg-white text-black hover:bg-blue-500 hover:text-white hover:border-neutral-700 font-bold rounded-md px-4 py-1.5 cursor-pointer disabled:opacity-50">
            Continue with Google</button>
          </div>
 
      </div>

    </form>
  )
}