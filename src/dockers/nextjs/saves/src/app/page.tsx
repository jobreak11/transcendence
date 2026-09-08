'use client'
import Link from 'next/link'
import { url } from 'node:inspector';
import { useEffect } from 'react';

import { signOut } from "../lib/auth";

export default function Page() {

  const handleGoogleLogin = () => {
    window.location.href = 'https://localhost:4333/api/auth/google/login';
  };

  const handle42Login = () => {
    window.location.href = 'https://localhost:4333/api/auth/42/login';
  };

  useEffect(() => {

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('jwtToken', token);
      window.location.href = 'https://localhost:4333/';
    }
  }, []);

  return (
    <div className='flex flex-col justify-center items-center'>
      <div>
        <h1>Transcendence Poker</h1>
      </div>

      <div>
        <button onClick={handleGoogleLogin}>Login with google</button>
      </div>
      <div>
        <button onClick={handle42Login}>Login with 42</button>
      </div>
      <form action={signOut}>
      <button 
        type="submit"
        className="bg-red-600 border-black hover:bg-red-700 text-white font-bold rounded-md px-4 py-1.5 cursor-pointer disabled:opacity-50"
      >
        Sign Out
      </button>
    </form>
    </div>
  )
}

