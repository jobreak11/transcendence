'use client'
import { SubmitButton } from "./submitButton";
import React, { useActionState } from "react";
import { signUp } from "../../../lib/auth";

export default function SignupForm() {

  const [state, action] = useActionState(signUp, undefined);

  return (
    <form action={action}>
      <div className="flex flex-col gap-2 mb-6">
        {state?.message && <p className="text-sm text-red-500">{state.message}</p>}

        <div className="gap-3 flex">
          <label htmlFor="displayName">displayName</label>
          <input id="displayName" name="displayName" placeholder="John Doe" />
        </div>
        {state?.error?.properties?.displayName && <p className="text-sm text-red-500">{state.error.properties.displayName.errors}</p>}

        <div className="flex gap-3">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder='john@example.com' />
        </div>
        {state?.error?.properties?.email && <p className="text-sm text-red-500">{state.error.properties.email.errors}</p>}

        <div className="flex gap-3">
          <label htmlFor="password">Password</label>
          <input className="bg-black/10" id="password" name="password" type="password" />
        </div>
        {state?.error?.properties?.password && 
        <div>
          <p>Password Must:</p>
          <ul>
            {state.error.properties.password.errors.map((error) => (
              <li key={error}>error</li>
            ))}
          </ul>
        </div>
        }

        <SubmitButton>Sign Up</SubmitButton>
      </div>
    </form>
  )
}