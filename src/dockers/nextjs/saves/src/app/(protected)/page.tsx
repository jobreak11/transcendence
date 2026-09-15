'use client'

import { signOut } from "../../lib/auth";
import { useEffect } from 'react';


export default function Page() {

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

