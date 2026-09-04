'use client';
import { PropsWithChildren } from "react";
import React from "react";
import { useFormStatus } from 'react-dom';

export function SubmitButton({children}: PropsWithChildren) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending}
    className="w-full mt-2 bg-black p-2 rounded-lg text-white"
    >
      {pending ? 'Submitting...' : children}
    </button>
  )
}