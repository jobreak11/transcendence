import SignupForm from "./signupForm";

const SignUpPage = () => {
  return (
    <div className="min-h-screen w-full max-w-md flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="goldheader">
        Sign Up
      </h1>
      <SignupForm />
    </div>
  )
}

export default SignUpPage;