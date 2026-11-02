import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GameSocketProvider } from "../(protected)/_context/useGameSocket";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    redirect("/auth/signin?callbackUrl=%2Fgame");
  }

  return (
    <GameSocketProvider accessToken={accessToken}>
      {children}
    </GameSocketProvider>
  );
}
