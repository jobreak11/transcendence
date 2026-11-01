'use client'

import { useEffect, useRef, useState } from "react";
import { signOut } from "../../lib/auth";
import Link from "next/link";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      {children}
    </div>
  );
}

export default function Page() {
  return (
    <div>
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-b from-transparent via-green-900 via-55% to-transparent px-4">
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

        <h1 className="font-mono text-3xl sm:text-4xl tracking-wide text-transparent bg-clip-text bg-linear-to-b from-[#fce085] via-[#d4af37] to-[#997312] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Transcend 888
        </h1>

        <div className="flex flex-col gap-3 w-28 mt-2">
          <Link
            href="/game"
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
      <a href="#about" 
          className="absolute bottom-6 flex flex-col items-center text-neutral-400 hover:text-white transition-colors gap-1 text-xs cursor-pointer">
      </a>
    </main>
    <section id="about" className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-950 px-6 py-16 text-center">
        <div className="max-w-xl w-full flex flex-col items-center gap-6">
          
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              About Us
            </h2>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Transcend 888 is an online web poker game, created as part of 42 project, transcendence. 
              This project is non-commercialized and will always be free of charge.
            </p>
          </Reveal>
          <Reveal delay={450}>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Here, you can play the well-known poker card game anywhere. Having short fun testing your luck with your 
              friends, or login with an account that tracks your progress to show the world how good you are, we all 
              have it covered. With no coins, chips, nor payment, you can enjoy poker to its fullest.
            </p>
          </Reveal>

          <Reveal delay={600}>
            <Link
              href="/about"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-md text-base shadow-md transition-colors mt-2"
            >
              Learn More
            </Link>
          </Reveal>

        </div>
      </section>
    
    </div>
  )
}

