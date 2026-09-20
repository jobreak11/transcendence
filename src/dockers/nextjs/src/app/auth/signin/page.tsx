import { SignInForm } from "./signInForm"
import { ChatPopup } from "../../chat/ChatPopup"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <main className="w-full max-w-sm rounded-lg bg-white p-8 text-black shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold">
          Sign In Page
        </h1>
        <SignInForm />
      </main>
      <ChatPopup />
    </div>
  )
}