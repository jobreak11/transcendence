'use client';
import { useActionState } from "react";
import { SubmitButton } from "../signup/submitButton";
import { signIn } from "../../../lib/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DEFAULT_LANDING_PAGE_URL } from "../../../lib/constants";

export function SignInForm() {

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || DEFAULT_LANDING_PAGE_URL;

  const [state, action, isPending] = useActionState(signIn, undefined);

  return (
    <form action={action}>

      <input type="hidden" name="callbackUrl" value={callbackUrl}/>
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
          <input id="password" name="password" placeholder="••••••••" type="password" 
          className="bg-[#2a2a2a] flex-1 min-w-0 text-white border border-[#666] rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-400"/>
        </div>
        {state?.error?.properties?.password &&
        <p className="text-xs text-red-500">{state.error.properties.password.errors[0]}</p>
        }
        {state?.message && <p className="text-sm text-red-500">{state.message}</p>}

        <div className="pt-2 flex items-center justify-center w-full gap-2">
        <SubmitButton isPending={isPending}>Login</SubmitButton>
        <span>or</span>
        <Link className="text-sm underline" href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            Sign Up?
        </Link>
        </div>

        <div className="pt-2 flex items-center justify-center w-full gap-2">
          </div>
 
      </div>

    </form>
  )
}