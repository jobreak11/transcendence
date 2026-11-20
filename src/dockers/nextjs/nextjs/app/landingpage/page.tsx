'use client'

import { useEffect, useRef, useState } from "react";
import { signOut } from "../../lib/auth";
import Link from "next/link";
import { useMainSocket } from "./_context/useMainSocket";

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
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-6 w-full bg-linear-to-b from-transparent from-20% via-green-900 via-50% to-transparent to-80%">
        
        <div className="w-[30vw] h-[30vw] relative flex items-center justify-center">
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            {/* <img src="../logo3D.svg"></img> */}
			{/* <span className="font-semibold">Logo</span> */}
          </div>
        </div>

        <h1 className="goldheader">
          Transcend 888
        </h1>

        <div className="flex flex-col gap-3 w-28 mt-2">
          <Link
            href="/game"
            className="rounded-lg border-transparent bg-red-600 px-2.5 py-2 text-center font-bold text-white no-underline"
          >
            Play
          </Link>
          <Link
            href="/auth/signin"
            className="rounded-lg border-transparent bg-red-600 px-2.5 py-2 text-center font-bold text-white no-underline"
          >Login</Link>
          <form action={signOut}>
          <button 
            type="submit"
            // className="w-full bg-red-600 border-black hover:bg-red-700 text-white font-bold rounded-md px-4 py-1.5 cursor-pointer disabled:opacity-50"
          >Sign Out</button>
          </form>
        </div>
      </div>
      <a href="#about" 
          className="absolute bottom-6 flex flex-col items-center text-neutral-400 hover:text-white transition-colors gap-1 text-xs cursor-pointer">
      </a>
    </main>
    <section id="about" className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-16 text-center">
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
              className="rounded-lg border-transparent bg-red-600 px-2.5 py-2 text-center font-bold text-white no-underline"
            >
              Learn More
            </Link>
          </Reveal>

        </div>
      </section>
    
    </div>
  )
}

