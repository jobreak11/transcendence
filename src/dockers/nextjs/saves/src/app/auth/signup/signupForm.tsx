'use client'
import { SubmitButton } from "./submitButton";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupForm() {

  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setServerMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      displayName: form.get('displayName'),
      email: form.get('email'),
      password: form.get('password'),
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          setErrors(result.errors);
        } else if (result.message) {
          setServerMessage(result.message);
        }
        return ;
      }

      router.push('/auth/signin');
    } catch (err) {
      setServerMessage('An unexpected error occured');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2 mb-6">
        {serverMessage && (<p className="text-red-500 text-sm">{serverMessage}</p>)}

        <div className="gap-3 flex">
          <label htmlFor="displayName">displayName</label>
          <input id="displayName" name="displayName" placeholder="John Doe" />
        </div>
        {errors.displayName && (<p className="text-red-500 text-xs">{errors.displayName[0]}</p>)}

        <div className="flex gap-3">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder='john@example.com' />
        </div>
        {errors.email && (<p className="text-red-500 text-xs">{errors.email[0]}</p>)}

        <div className="flex gap-3">
          <label htmlFor="password">Password</label>
          <input className="bg-black/10" id="password" name="password" type="password" />
        </div>
        {errors.password && (<p className="text-red-500 text-xs">{errors.password[0]}</p>)}

        <SubmitButton>Sign Up</SubmitButton>
      </div>
    </form>
  )
}