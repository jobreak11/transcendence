import Image from "next/image";
import profile_sample from "../../../public/profile_sample.png"

export default function ProfileImage({ className }: { className: string }) {
  return (
    <div className={className}>
      <Image
        src={profile_sample}
        alt="Profile picture"
        fill
        priority
        sizes="(max-width: 700px) 160px, 15vw"
      />
    </div>
  );
}
