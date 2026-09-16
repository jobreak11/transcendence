'use client'

import Link from "next/link";
import Image from "next/image"; //for image adding
import { signOut } from "../../lib/auth";


export default function Page() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-radial from-green-900 via-green-950 via-55% to-black px-4">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        
        <div className="w-56 h-56 relative flex items-center justify-center">
          {/*Logo field
          <Image 
            src="/logo.svg" 
            alt="Transcend 888 Logo" 
            fill 
            className="object-contain" 
            priority 
          /> 
          */}
          <div className="w-full h-full border-2 border-dashed border-neutral-700 rounded-2xl flex flex-col items-center justify-center text-neutral-500 text-sm gap-1">
            <span className="font-semibold">Logo</span>
          </div>
        </div>

        <h1 className="font-mono text-3xl sm:text-4xl tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fce085] via-[#d4af37] to-[#997312] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Transcend 888
        </h1>

        <div className="flex flex-col gap-3 w-28 mt-2">
          <Link
            href="/mainmenu"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-md text-center text-base shadow-md transition-colors cursor-pointer"
          >
            Play
          </Link>
          <Link
            href="/auth/signin"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-md text-center text-base shadow-md transition-colors cursor-pointer"
          >Login</Link>
          <form action={signOut}>
          <button 
            type="submit"
            className="w-full bg-red-600 border-black hover:bg-red-700 text-white font-bold rounded-md px-4 py-1.5 cursor-pointer disabled:opacity-50"
          >Sign Out</button>
          </form>
        </div>
      </div>
      <Link href={'/ws-test'}> Go to websocket test page</Link>
    </main>
  )
}

