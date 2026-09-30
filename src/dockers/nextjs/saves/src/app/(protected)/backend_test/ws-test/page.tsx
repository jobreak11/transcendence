import Link from "next/link";
import { WebSocketTestComponent } from "./WebsocketTestComponent";
import { cookies } from "next/headers";

export default async function Page() {

  return (
    <div>
      <WebSocketTestComponent/>
      <Link href={"/backend_test"} className="bg-amber-900 m-5 p-5 rounded-4xl">back to backend root page</Link>
    </div>
  )
}