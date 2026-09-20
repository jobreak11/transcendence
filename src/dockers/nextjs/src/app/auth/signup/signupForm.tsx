'use client'
import { SubmitButton } from "./submitButton";
import React, { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Signup } from "../../../lib/auth";

export default function SignupForm() {

  const [state, formAction, isPending] = useActionState(Signup, undefined);

  return (
    <form action={formAction}>
      <div className="flex flex-col gap-2 mb-6">
        {state?.message && (<p className="text-red-500 text-sm">{state.message}</p>)}

        <div className="gap-3 flex">
          <label htmlFor="displayName">displayName</label>
          <input id="displayName" name="displayName" placeholder="John Doe" defaultValue={state?.fields?.displayName} />
        </div>
        {state?.error?.properties?.displayName &&
          <p className="text-red-500 text-xs">
            {state.error.properties.displayName.errors[0]}
          </p>
        }

        <div className="flex gap-3">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder='john@example.com' defaultValue={state?.fields?.email} />
        </div>
        {state?.error?.properties?.email &&
          <p className="text-red-500 text-xs">
            {state.error.properties.email.errors[0]}
          </p>
        }

        <div className="flex gap-3">
          <label htmlFor="password">Password</label>
          <input className="bg-black/10" id="password" name="password" type="password" />
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

        <SubmitButton isPending={isPending}>Sign Up</SubmitButton>
      </div>
    </form>
  )
}