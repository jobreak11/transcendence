import Link from "next/link";
import { NoBodyRequestTestComponent } from "../components/NoBodyRequestTestComponent";
import { FormRequestTestComponent } from "../components/FormRequestTestComponen";




export default function Page() {
  return (
    <main className="flex flex-col">
      <div className="flex flex-col items-center mx-auto bg-slate-900 rounded-2xl p-7">

        <NoBodyRequestTestComponent name="user profile" apiPath="/api/user/profile"/>
        <NoBodyRequestTestComponent name="show user friend" apiPath="/api/friend"/>
        <FormRequestTestComponent name="add friend" method="POST" queryParams={["targetUserId"]} apiPath="/api/friend/request" />
        <FormRequestTestComponent name="accept friend Request" method="PATCH" queryParams={['targetUserId']} apiPath="/api/friend/accept" />


      </div>
      <Link href={`/backend_test`}>back</Link>
    </main>
  )
}