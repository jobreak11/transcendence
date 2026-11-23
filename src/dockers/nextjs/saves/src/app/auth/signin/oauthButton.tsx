'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { TRANSCENDENCE_BASE_URL } from '../../../lib/constants';

export function OauthButton() {

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  console.log({callbackUrl});

  const handleGoogleLogin = () => {
    window.location.href = `${TRANSCENDENCE_BASE_URL}/api/auth/google/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const handle42Login = () => {
    window.location.href = `${TRANSCENDENCE_BASE_URL}/api/auth/42/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  useEffect(() => {

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accesstoken');

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      window.location.href = `${TRANSCENDENCE_BASE_URL}`;
    }
  }, []);

  return (
    <div className='flex flex-col justify-center items-center gap-3'>
        <a href={`/api/auth/42/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="oauth bg-black">
            <img src="../../42logoBordered.svg" alt="" className="h-4 w-4 mr-[3%]"/>Continue with 42
		</a>
        <a href={`/api/auth/google/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="oauth bg-white">
            <img src="../../googleIcon.svg" alt="" className="h-4 w-4 mr-[3%]"/>Continue with Google
		</a>
    </div>
  )
}