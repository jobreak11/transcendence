import type { ReactNode } from "react";

export default function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border border-white/5 bg-zinc-800/80 p-4 shadow-2xl backdrop-blur-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}
