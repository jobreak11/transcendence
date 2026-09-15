import { cookies } from "next/headers";
import { WebSocketTestComponent } from "./WebsocketTestComponent";

export default async function Page() {

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  return (
    <div>
      <WebSocketTestComponent accessToken={accessToken} />
    </div>
  )
}