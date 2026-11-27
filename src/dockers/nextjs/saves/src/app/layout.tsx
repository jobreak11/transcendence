import React from 'react'
import './global.css'
import './style.css'
import LanguageProvider from './components/language/LanguageProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className='max-w-screen overflow-x-hidden'>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        </body>
    </html>
  );
}

// import { Manrope } from 'next/font/google'

// const manrope = Manrope({
//   subsets: ['latin'],
//   weight: ['400', '600', '700'],
// });

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en">
//     <body className={`bg-black text-white 
//       min-h-screen
//       h-screen
//       ${manrope.className}
//       `}>{children}</body>
//     </html>
//   );
// }