import { cookies } from "next/headers"
import React from "react"
import { MainSocketProvider } from "./_context/useMainSocket";

export default  async function layout({
  children
}: {
  children: React.ReactNode
}) {

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value ?? '';

  return (
    <main>
      <MainSocketProvider accessToken={accessToken}>
        {children}
      </MainSocketProvider>
    </main>
  )
}