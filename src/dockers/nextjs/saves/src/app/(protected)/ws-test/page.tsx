import Link from "next/link";
import { WebSocketTestComponent } from "./WebsocketTestComponent";
import { cookies } from "next/headers";

export default async function Page() {

  return (
    <div>
      <WebSocketTestComponent/>
      <Link href={"/"}>Go to root page</Link>
    </div>
  )
}