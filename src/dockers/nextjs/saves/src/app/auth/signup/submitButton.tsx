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
    className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-md px-4 py-1.5 border-none cursor-pointer disabled:opacity-50"
    >
      {isPending ? 'Submitting...' : children}
    </button>
  )
}