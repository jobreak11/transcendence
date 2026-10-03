import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "User Profile - Transcend 888",
  description: "Transcend 888 player profile",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
