'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function OauthButton() {

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  console.log({callbackUrl});

  const handleGoogleLogin = () => {
    window.location.href = `https://localhost:4333/api/auth/google/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const handle42Login = () => {
    window.location.href = `https://localhost:4333/api/auth/42/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  useEffect(() => {

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accesstoken');

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      window.location.href = 'https://localhost:4333/';
    }
  }, []);

  return (
    <div className='flex flex-col justify-center items-center gap-3'>
        <button onClick={handle42Login}
        className="bg-black w-full hover:bg-cyan-500 hover:text-black hover:border-cyan-500 font-bold rounded-md px-4 py-1.5 cursor-pointer disabled:opacity-50">
            Continue with 42</button>
        <button onClick={handleGoogleLogin}
        className="bg-white w-full text-black hover:bg-blue-500 hover:text-white hover:border-neutral-700 font-bold rounded-md px-4 py-1.5 cursor-pointer disabled:opacity-50">
            Continue with Google</button>
    </div>
  )
}