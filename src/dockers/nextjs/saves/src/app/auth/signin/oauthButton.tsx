'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { TRANSCENDENCE_BASE_URL } from '../../../lib/constants';
import logo42Bordered from '../../../assets/img/42logoBordered.svg'
import googleIcon from '../../../assets/img/googleIcon.svg'
import Image from 'next/image';

export function OauthButton() {

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  console.log({callbackUrl});

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const handle42Login = () => {
    window.location.href = `/api/auth/42/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
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
        <button onClick={handle42Login}
        className="oauth bg-black">
            <Image src={logo42Bordered} alt="" className="h-4 w-4 mr-[3%]"/>Continue with 42
		    </button>
        <button onClick={handleGoogleLogin}
        className={`
        bg-white
          oauth
          `}
        >
            <Image src={googleIcon} alt="" className="h-4 w-4 mr-[3%]"/>Continue with Google
		</button>

    </div>
  )
}