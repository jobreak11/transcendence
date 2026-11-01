import Link from "next/link";
import { WsConnectionId } from "./WsConnectionId";
import { FormRequestTestComponent } from "../components/FormRequestTestComponen";
import { ChatBoxComponent } from "../components/ChatBoxComponent";

export default function Page() {



  return (
    <main>
      <Link href={"/backend_test"}>Back to main backend test</Link>

      <div className="mt-5 p-4 m-3 flex flex-col bg-purple-950 rounded">
        <WsConnectionId />
        <FormRequestTestComponent method="GET" apiPath="/api/user/profile" name="Your user profile" />
        <FormRequestTestComponent method="GET" apiPath="/api/chat" name="Show all Chat room" />
        <FormRequestTestComponent method="GET" apiPath="/api/friend" name="Show Friend" />
        <FormRequestTestComponent method="POST" apiPath="/api/chat/dm" name="DM room to user" queryParams={["targetUserId"]} />
        <ChatBoxComponent />
      </div>
    </main>
  )
}