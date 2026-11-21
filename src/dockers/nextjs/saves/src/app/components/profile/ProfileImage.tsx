"use client";

import {
  useEffect,
  useState,
} from "react";

import defaultProfilePicture from "../../../public/profile_sample.png";

type ProfileImageProps = {
  className: string;
  imageUrl?: string | null;
};

function normalizeImageUrl(
  imageUrl?: string | null,
) {
  const trimmedUrl =
    imageUrl?.trim();

  if (!trimmedUrl) {
    return null;
  }

  try {
    const parsedUrl =
      new URL(trimmedUrl);

    /*
     * The storage route is served from the
     * same domain as the frontend.
     */
    if (
      parsedUrl.pathname.startsWith(
        "/storage/",
      )
    ) {
      return (
        parsedUrl.pathname +
        parsedUrl.search
      );
    }

    return trimmedUrl;
  } catch {
    return trimmedUrl.startsWith("/")
      ? trimmedUrl
      : `/${trimmedUrl}`;
  }
}

export default function ProfileImage({
  className,
  imageUrl,
}: ProfileImageProps) {
  const normalizedImageUrl =
    normalizeImageUrl(imageUrl);

  const [hasImageError, setHasImageError] =
    useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [normalizedImageUrl]);

  const imageSource =
    normalizedImageUrl &&
    !hasImageError
      ? normalizedImageUrl
      : defaultProfilePicture.src;

  console.log(
    "API avatar URL:",
    imageUrl,
  );

  console.log(
    "Rendered avatar URL:",
    imageSource,
  );

  return (
    <div
      className={`${className} relative overflow-hidden`}
    >
      <img
        src={imageSource}
        alt="Profile picture"
        className="h-full w-full object-cover"
        onError={() => {
          console.error(
            "Unable to load profile image:",
            imageSource,
          );

          setHasImageError(true);
        }}
      />
    </div>
  );
}

// import Image from "next/image";

// import defaultProfilePicture from "../../../public/profile_sample.png";

// type ProfileImageProps = {
//   className: string;
//   imageUrl?: string | null;
// };

// export default function ProfileImage({
//   className,
//   imageUrl,
// }: ProfileImageProps) {
//   const imageSource =
//     imageUrl?.trim()
//       ? imageUrl
//       : defaultProfilePicture;

//   return (
//     <div className={className}>
//       <Image
//         src={imageSource}
//         alt="Profile picture"
//         fill
//         priority
//         unoptimized={
//           typeof imageSource === "string"
//         }
//         sizes="(max-width: 700px) 160px, 15vw"
//         className="object-cover"
//       />
//     </div>
//   );
// }

