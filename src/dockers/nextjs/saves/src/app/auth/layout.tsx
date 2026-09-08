import { PropsWithChildren } from "react";

const AuthLayout = ({children}: PropsWithChildren) => {
  return (
    <div
    className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-400 h-screen flex items-center
    justify-center
    "
    >
      {children}
    </div>
  )
}

export default AuthLayout;