import { PropsWithChildren } from "react";

const AuthLayout = ({children}: PropsWithChildren) => {
  return (
    <div
    className="bg-gradient-to-b from-black via-green-600 to-black h-screen flex items-center
    justify-center
    "
    >
      {children}
    </div>
  )
}

export default AuthLayout;