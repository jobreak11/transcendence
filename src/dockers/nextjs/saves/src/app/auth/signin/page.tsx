import { SignInForm } from "./signInForm"
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { OauthButton } from "./oauthButton";

export default async function SignInPage() {
  const cookieStore = await cookies();

  /* If the access token already exist wouldn't perform the login
  and redirect to the page '/'
   */
  const accessToken = cookieStore.get("accessToken")?.value;
  if (accessToken){
    redirect('/profile');
  }

  return (
    <div className="min-h-screen w-full max-w-md flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="goldheader">
        Transcend 888
      </h1> 
      <SignInForm/>
      <OauthButton/>
    </div>
  )
}