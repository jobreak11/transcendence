import SignupForm from "./signupForm";

const SignUpPage = () => {
  return (
    <div className="min-h-screen w-full max-w-md bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-400 flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="-mt-50 bg-gradient-to-r from-amber-400 via-orange-900 to-yellow-300 bg-clip-text text-4xl font-black uppercase tracking-wider text-transparent drop-shadow-[2px_2px_0px_rgba(255,255,255,0.3)]">
        Sign Up
      </h1>
      <SignupForm />
    </div>
  )
}

export default SignUpPage;