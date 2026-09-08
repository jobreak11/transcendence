import Link from 'next/link'
import { signOut } from "../lib/auth";

export default function Page() {

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

