import Link from "next/link";
import { GetRequestTestComponent } from "../components/GetRequestTestComponent";
import { PostFormRequestTestComponent } from "../components/PostRequestTestComponen";




export default function Page() {
  return (
    <main className="flex flex-col items-baseline">
      <div className="flex flex-col items-center mx-auto bg-slate-900 rounded-2xl p-7">

        <GetRequestTestComponent name="user profile" apiPath="/api/user/profile"/>
        <PostFormRequestTestComponent name="test" apiPath="test" requiredField={["userName", "Password"]} />

      </div>
      <Link href={`/backend_test`}>back</Link>
    </main>
  )
}