import { useState } from "react";
import { SubmitButton } from "../signup/submitButton";

export function SignInForm() {

  return (
    <form>

      <div className="flex flex-col gap-2 w-64">

        <div className="gap-2 flex">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder="m@example.com" type="email" />
        </div>

        <div className="gap-2 flex">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="bg-black/10 rounded-2xl" />
        </div>

        <SubmitButton>Sign In</SubmitButton>

      </div>

    </form>
  )
}