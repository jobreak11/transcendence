import { cookies } from "next/headers";
import React from "react";
import { MainSocketProvider } from "./_context/useMainSocket";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  // proxy.ts (Step 6) already verified/refreshed this token and injected it into request.cookies!
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    redirect("/auth/signin");
  }

  return (
    <main>
      <MainSocketProvider accessToken={accessToken}>
        {children}
      </MainSocketProvider>
    </main>
  );
}
