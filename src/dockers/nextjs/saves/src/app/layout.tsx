import React from 'react'
import './globals.css'
import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
    <body className={`bg-black text-white 
      min-h-screen
      h-screen
      ${manrope.className}
      `}>{children}</body>
    </html>
  );
}
