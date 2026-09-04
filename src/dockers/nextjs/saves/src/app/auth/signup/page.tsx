import Link from "next/link"
import SignupForm from "./signupForm";

const SignUpPage = () => {
  return (
    <div className="bg-white p-8 rounded-lg w-96
    flex flex-col justify-center items-center
    text-black
    ">
      <h1 className="text-center text-2xl font-bold mb-4">
        Sign In Page
      </h1>

      {/* sign up form  */}
      <SignupForm />

      <div className="flex justify-between text-sm">
        <p>Already have an account?</p>
        <Link className="underline" href={'/auth/signin'}>
          Sign In
        </Link>

      </div>

    </div>
  )
}

export default SignUpPage;