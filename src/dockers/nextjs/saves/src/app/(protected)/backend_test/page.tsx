
import Link from "next/link";
import { text } from "node:stream/consumers";
import React from "react"

interface infoCardProps extends React.HTMLAttributes<HTMLDivElement> {

};

function InfoCard({children, className, ...props}: infoCardProps) {
  return (
    <div className={`${className} bg-slate-700 p-5 rounded-3xl`} {...props}>
      {children}</div>
  )
}

const TestPages: {
  pageName: string;
  pageLink: string;
  description? : string;
}[] = [
  {
    pageName: "WebSocket basic test",
    pageLink: "/backend_test/ws-test",
    description: "test that the client side can establish the web socket connection to backend websocket socket.io"
  },
  {
    pageName: "Friend Api Test",
    pageLink: "/backend_test/friend_test",
    description: "test the friend system"
  },
  {
    pageName: "Chat System Test",
    pageLink: "/backend_test/chat_test",
    description: "to test the chat system, notification and websocket connection"
  }
];

export default function Page() {
  return (
  <main className="flex flex-col items-center">
    <div
    className="bg-slate-800 p-4 m-6 text-4xl rounded-2xl"
    > Backend test Page </div>
    <InfoCard className="mt-8">
      <h1 className="text-4xl font-bold">Lists</h1>
      <ul className="mt-8">
        {TestPages.map((test) => (
          <li key={test.pageName}
          className="mb-5"
          >
            <Link href={test.pageLink}
            className="text-green-500 text-2xl underline"
            >{test.pageName}</Link>
            {test.description ? <p> - {test.description}</p> : null}
          </li>
        ))}
      </ul>

    </InfoCard>
  </main>
  )
}