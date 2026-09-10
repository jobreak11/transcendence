'use client'
import { SubmitButton } from "./submitButton";
import React, { useActionState, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Signup } from "../../../lib/auth";
import Link from "next/link"
import { DEFAULT_LANDING_PAGE_URL } from "../../../lib/constants";

export default function SignupForm() {

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || DEFAULT_LANDING_PAGE_URL;

  const [state, formAction, isPending] = useActionState(Signup, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="callbackUrl" value={callbackUrl}/>
      <div className="flex flex-col gap-2 mb-6">
        {state?.message && (<p className="text-red-500 text-sm">{state.message}</p>)}

        <div className="w-full flex items-center justify-between gap-3">
          <label htmlFor="displayName" className="text-white text-sm whitespace-nowrap">Display Name:</label>
          <input id="displayName" name="displayName" placeholder="Username" defaultValue={state?.fields?.displayName} 
          className="flex-1 min-w-0 bg-[#2a2a2a] text-white border border-[#666] rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-400" />
        </div>
        {state?.error?.properties?.displayName &&
          <p className="text-red-500 text-xs">
            {state.error.properties.displayName.errors[0]}
          </p>
        }

        <div className="w-full flex items-center justify-between gap-3">
          <label htmlFor="email" className="text-white text-sm whitespace-nowrap">Email:</label>
          <input id="email" name="email" placeholder='name@example.com' defaultValue={state?.fields?.email} 
          className="flex-1 min-w-0 bg-[#2a2a2a] text-white border border-[#666] rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-400"/>
        </div>
        {state?.error?.properties?.email &&
          <p className="text-red-500 text-xs">
            {state.error.properties.email.errors[0]}
          </p>
        }

        <div className="w-full flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-white text-sm whitespace-nowrap">Password:</label>
          <input id="password" name="password" placeholder="••••••••" type="password"
          className="flex-1 min-w-0 bg-[#2a2a2a] text-white border border-[#666] rounded-md px-3 py-1.5 focus:outline-none focus:border-neutral-400" />
        </div>
        {state?.error?.properties?.password &&
          <div className="text-red-500 text-xs">
            <ul>
              {state.error.properties.password.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        }

        <div className="pt-2 flex items-center justify-center w-full gap-2">
        <SubmitButton isPending={isPending}>Sign up</SubmitButton>
        <span>or</span>
        <Link className="text-sm underline" href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            Sign in?
        </Link>
        </div>
      </div>
    </form>
  )
}