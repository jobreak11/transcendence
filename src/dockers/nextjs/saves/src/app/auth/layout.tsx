import { PropsWithChildren } from "react";
// import "../PATH/style.css"; <!-- input the path where the file is located -->

const AuthLayout = ({children}: PropsWithChildren) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom,black_20%,#14532d_50%,black_80%)]">
      {children}
    </div>
  )
}

export default AuthLayout;