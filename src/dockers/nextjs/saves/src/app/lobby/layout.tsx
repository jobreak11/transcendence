import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MainSocketProvider } from "../(protected)/_context/useMainSocket";

export default async function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    redirect("/auth/signin?callbackUrl=%2Flobby");
  }

  return (
    <MainSocketProvider accessToken={accessToken}>
      {children}
    </MainSocketProvider>
  );
}
