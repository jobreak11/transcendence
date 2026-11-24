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
        className="oauth bg-black">
            <img src="../../42logoBordered.svg" alt="" className="h-4 w-4 mr-[3%]"/>Continue with 42
		</button>
        <button onClick={handleGoogleLogin}
        className="oauth bg-white text-black">
            <img src="../../googleIcon.svg" alt="" className="h-4 w-4 mr-[3%]"/>Continue with Google
		</button>
    </div>
  )
}