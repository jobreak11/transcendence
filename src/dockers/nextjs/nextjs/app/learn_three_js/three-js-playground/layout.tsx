import React from 'react'
import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='w-full h-full'>
      {children}
    </div>
  );
}