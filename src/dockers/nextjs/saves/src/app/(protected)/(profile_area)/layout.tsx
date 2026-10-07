import type { ReactNode } from "react";
import ProfileAreaShell from "../../components/profile/ProfileAreaShell";
import "./profile-area.css";

export default function ProfileAreaLayout({ children }: { children: ReactNode }) {
  return <ProfileAreaShell>{children}</ProfileAreaShell>;
}
