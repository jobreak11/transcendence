import type { ReactNode } from "react";
import { ProfileProvider } from "./ProfileProvider";
import SiteHeader from "./SiteHeader";

export default function ProfileAreaShell({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <div className="profile-area min-h-screen text-white">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {children}
        </main>
      </div>
    </ProfileProvider>
  );
}
