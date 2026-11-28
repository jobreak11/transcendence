"use client";

import {
  useEffect,
  useState,
} from "react";

// import defaultProfilePicture from "../../../assets/profile_sample.png";

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
      : `/img/defaultProfilePic.svg`
      // : defaultProfilePicture.src;

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
        referrerPolicy="no-referrer"
        onError={() => {
          console.warn(
            "Unable to load profile image:",
            imageSource,
          );

          setHasImageError(true);
        }}
      />
    </div>
  );
}
