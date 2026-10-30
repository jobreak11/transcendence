import Image from "next/image";

import defaultProfilePicture from "../../../public/profile_sample.png";

type ProfileImageProps = {
  className: string;
  imageUrl?: string | null;
};

export default function ProfileImage({
  className,
  imageUrl,
}: ProfileImageProps) {
  const imageSource =
    imageUrl?.trim()
      ? imageUrl
      : defaultProfilePicture;

  return (
    <div className={className}>
      <Image
        src={imageSource}
        alt="Profile picture"
        fill
        priority
        unoptimized={
          typeof imageSource === "string"
        }
        sizes="(max-width: 700px) 160px, 15vw"
        className="object-cover"
      />
    </div>
  );
}

// import Image from "next/image";
// import profile_sample from "../../../public/profile_sample.png"

// export default function ProfileImage({ className }: { className: string }) {
//   return (
//     <div className={className}>
//       <Image
//         src={profile_sample}
//         alt="Profile picture"
//         fill
//         priority
//         sizes="(max-width: 700px) 160px, 15vw"
//       />
//     </div>
//   );
// }
