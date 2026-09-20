'use client';
import { PropsWithChildren } from "react";
import React from "react";
import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  children: React.ReactNode;
  isPending?: boolean;
}

export function SubmitButton({children, isPending}: SubmitButtonProps) {
  return (
    <button type="submit" disabled={isPending}
    className="w-full mt-2 bg-black p-2 rounded-lg text-white"
    >
      {isPending ? 'Submitting...' : children}
    </button>
  )
}