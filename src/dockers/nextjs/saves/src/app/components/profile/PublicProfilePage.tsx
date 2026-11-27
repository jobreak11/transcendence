"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import ProfileImage from "./ProfileImage";

import FriendActionButton from
  "../friends/FriendsActionButton";

import {
  getFriendData,
  getFriendshipStatus,
  type FriendshipStatus,
} from "../../../lib/friends-api";

import {
  getPublicProfileByTagId,
  type PublicUserProfileResponse,
} from "../../../lib/profile-api";

type PublicProfilePageProps = {
  tagId: string;
};

export default function PublicProfilePage({
  tagId,
}: PublicProfilePageProps) {
  const [profile, setProfile] =
    useState<
      PublicUserProfileResponse | null
    >(null);

  const [
    friendshipStatus,
    setFriendshipStatus,
  ] = useState<
    FriendshipStatus | null
  >(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadPage() {
      setIsLoading(true);
      setError("");

      try {
        const [
          loadedProfile,
          friendData,
        ] = await Promise.all([
          getPublicProfileByTagId(
            tagId,
            controller.signal,
          ),

          getFriendData(
            controller.signal,
          ),
        ]);

        if (
          controller.signal.aborted
        ) {
          return;
        }

        setProfile(loadedProfile);

        const status =
          getFriendshipStatus(
            friendData,
            loadedProfile.userId,
            loadedProfile.isSelf ??
              false,
          );

        setFriendshipStatus(status);
      } catch (error) {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load profile.",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      controller.abort();
    };
  }, [tagId]);

  if (isLoading) {
    return <PublicProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-black px-4 py-12 text-white">
        <div className="mx-auto max-w-xl rounded-xl border border-red-500/30 bg-neutral-900 p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-red-400">
            Profile unavailable
          </h1>

          <p
            className="mt-3 text-neutral-300"
            role="alert"
          >
            {error ||
              "Profile not found."}
          </p>

          <Link
            href="/lobby"
            className="
              mt-6 inline-flex rounded-md
              bg-red-700 px-5 py-2
              font-semibold text-white
              transition hover:bg-red-600
            "
          >
            Return to lobby
          </Link>
        </div>
      </main>
    );
  }

  const displayName =
    profile.user_profile
      ?.displayName?.trim() ||
    profile.tagId;

  const joinedDate =
    formatJoinedDate(
      profile.createdAt,
    );

  return (
    <main
      className="
        min-h-screen bg-black
        bg-[radial-gradient(circle_at_top,rgba(113,63,18,0.28),transparent_38%)]
        px-4 py-6 text-white
        sm:px-8 sm:py-10
      "
    >
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/lobby"
            className="
              inline-flex items-center gap-2
              text-sm text-neutral-300
              transition hover:text-amber-300
            "
          >
            <span aria-hidden="true">
              ←
            </span>

            Back to lobby
          </Link>

          <Link
            href="/profile"
            className="
              text-sm text-neutral-400
              underline-offset-4
              transition hover:text-white
              hover:underline
            "
          >
            My profile
          </Link>
        </nav>

        <section
          className="
            overflow-hidden rounded-2xl
            border border-amber-300/15
            bg-neutral-900/90
            shadow-[0_24px_80px_rgba(0,0,0,0.65)]
          "
        >
          <div
            className="
              h-2 w-full
              bg-linear-to-r
              from-red-700
              via-red-500
              to-amber-400
            "
          />

          <div
            className="
              grid gap-8 p-5
              sm:p-8
              lg:grid-cols-[280px_1fr]
            "
          >
            <aside className="flex flex-col items-center">
              <div
                className="
                  relative aspect-square
                  w-full max-w-64
                  overflow-hidden
                  rounded-xl
                  border-2 border-amber-300/25
                  bg-black
                  shadow-xl
                "
              >
                <ProfileImage
                  className="w-full h-full object-cover object-center"
                  imageUrl={
                    profile.user_profile
                      ?.avatarUrl
                  }
                />
              </div>

              <div className="mt-5 text-center">
                <h1
                  className="
                    bg-linear-to-b
                    from-yellow-200
                    via-amber-400
                    to-amber-700
                    bg-clip-text
                    text-2xl font-bold
                    text-transparent
                    sm:text-3xl
                  "
                >
                  {displayName}
                </h1>

                <p className="mt-1 text-sm text-neutral-400">
                  @{profile.tagId}
                </p>

                <p
                  className="
                    mt-3 inline-flex
                    rounded-full
                    border border-amber-300/20
                    bg-amber-950/40
                    px-4 py-1.5
                    text-sm font-semibold
                    text-amber-200
                  "
                >
                  {profile.titleName ??
                    "No active title"}
                </p>
              </div>

              <div className="mt-6">
                {/* to edit add friend */}
                <FriendActionButton
                  targetUserId={
                    profile.userId
                  }
                  initialStatus={
                    friendshipStatus
                  }
                  onStatusChange={
                    setFriendshipStatus
                  }
                />
              </div>
            </aside>

            <div className="min-w-0">
              <section>
                <SectionTitle>
                  Player information
                </SectionTitle>

                <div
                  className="
                    mt-4 grid gap-3
                    sm:grid-cols-2
                  "
                >
                  <InformationCard
                    label="Display name"
                    value={displayName}
                  />

                  <InformationCard
                    label="Player ID"
                    value={
                      profile.tagId
                    }
                  />

                  <InformationCard
                    label="Pronoun"
                    value={
                      profile.user_profile
                        ?.pronoun ??
                      "Not specified"
                    }
                  />

                  <InformationCard
                    label="Joined"
                    value={joinedDate}
                  />
                </div>
              </section>

              <div className="my-8 h-px bg-linear-to-r from-transparent via-neutral-600 to-transparent" />

              <section>
                <SectionTitle>
                  Signature
                </SectionTitle>

                <blockquote
                  className="
                    mt-4 rounded-xl
                    border-l-4 border-red-600
                    bg-black/40 p-5
                    text-base leading-relaxed
                    text-neutral-200
                    sm:text-lg
                  "
                >
                  {profile.user_profile
                    ?.signature ??
                    "This player has not added a signature."}
                </blockquote>
              </section>
            
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2
      className="
        text-lg font-bold
        tracking-wide text-amber-200
        sm:text-xl
      "
    >
      {children}
    </h2>
  );
}

function InformationCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-lg border
        border-white/5
        bg-black/35 p-4
      "
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </div>

      <div className="mt-1 break-words text-base text-white">
        {value}
      </div>
    </div>
  );
}


function PublicProfileSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-black px-4 py-10 text-white">
      <div
        className="
          mx-auto grid max-w-6xl
          gap-8 rounded-2xl
          border border-white/5
          bg-neutral-900 p-8
          lg:grid-cols-[280px_1fr]
        "
      >
        <div className="aspect-square w-full rounded-xl bg-neutral-800" />

        <div className="space-y-5">
          <div className="h-8 w-52 rounded bg-neutral-800" />

          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-20 rounded-lg bg-neutral-800"
                />
              ),
            )}
          </div>

          <div className="h-28 rounded-xl bg-neutral-800" />

          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 rounded-lg bg-neutral-800"
                />
              ),
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function formatJoinedDate(
  createdAt: string,
) {
  const date = new Date(createdAt);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  ).format(date);
}
// "use client";

// import Link from "next/link";

// import {
//   useEffect,
//   useState,
// } from "react";

// import ProfileImage from "./ProfileImage";

// import FriendActionButton from
//   "../friends/FriendsActionButton";

// import {
//   getFriendData,
//   getFriendshipStatus,
//   type FriendshipStatus,
// } from "../../../lib/friends-api";

// import {
//   getPublicProfileByTagId,
//   type PublicUserProfileResponse,
// } from "../../../lib/profile-api";

// type PublicProfilePageProps = {
//   tagId: string;
// };

// export default function PublicProfilePage({
//   tagId,
// }: PublicProfilePageProps) {
//   const [profile, setProfile] =
//     useState<
//       PublicUserProfileResponse | null
//     >(null);

//   const [
//     friendshipStatus,
//     setFriendshipStatus,
//   ] = useState<
//     FriendshipStatus | null
//   >(null);

//   const [isLoading, setIsLoading] =
//     useState(true);

//   const [error, setError] =
//     useState("");

//   useEffect(() => {
//     const controller =
//       new AbortController();

//     async function loadPage() {
//       setIsLoading(true);
//       setError("");

//       try {
//         const [
//           loadedProfile,
//           friendData,
//         ] = await Promise.all([
//           getPublicProfileByTagId(
//             tagId,
//             controller.signal,
//           ),

//           getFriendData(
//             controller.signal,
//           ),
//         ]);

//         if (
//           controller.signal.aborted
//         ) {
//           return;
//         }

//         setProfile(loadedProfile);

//         /*
//          * The profile was found using tagId,
//          * but the friendship records use userId.
//          */
//         const status =
//           getFriendshipStatus(
//             friendData,
//             loadedProfile.userId,
//             loadedProfile.isSelf ??
//               false,
//           );

//         setFriendshipStatus(status);
//       } catch (error) {
//         if (
//           controller.signal.aborted
//         ) {
//           return;
//         }

//         setError(
//           error instanceof Error
//             ? error.message
//             : "Unable to load profile.",
//         );
//       } finally {
//         if (
//           !controller.signal.aborted
//         ) {
//           setIsLoading(false);
//         }
//       }
//     }

//     void loadPage();

//     return () => {
//       controller.abort();
//     };
//   }, [tagId]);

//   if (isLoading) {
//     return (
//       <main className="profile-page">
//         <p>Loading profile…</p>
//       </main>
//     );
//   }

//   if (error || !profile) {
//     return (
//       <main className="profile-page">
//         <p role="alert">
//           {error ||
//             "Profile not found."}
//         </p>

//         <Link
//           href="/lobby"
//           className="underline"
//         >
//           Return to lobby
//         </Link>
//       </main>
//     );
//   }

//   return (
//     <main className="profile-page">
//       <section className="content active">
//         <div className="blogbox profile-card">
//           <ProfileImage
//             className="large-profile-image"
//             imageUrl={
//               profile.user_profile
//                 ?.avatarUrl
//             }
//           />

//           <div className="profile-details">
//             <h1 className="goldfont">
//               {profile.user_profile
//                 ?.displayName ??
//                 profile.tagId}
//             </h1>

//             <div>
//               ID: {profile.tagId}
//             </div>

//             <div>
//               Title:{" "}
//               {profile.titleName ??
//                 "No active title"}
//             </div>

//             <div>
//               Pronoun:{" "}
//               {profile.user_profile
//                 ?.pronoun ??
//                 "Not specified"}
//             </div>

//             <br />

//             <hr />

//             <br />

//             <div>
//               Signature:{" "}
//               {profile.user_profile
//                 ?.signature ??
//                 "No signature"}
//             </div>

//             <div className="mt-6">
//               <FriendActionButton
//                 /*
//                  * Friend API still needs the
//                  * internal user UUID.
//                  */
//                 targetUserId={
//                   profile.userId
//                 }
//                 initialStatus={
//                   friendshipStatus
//                 }
//                 onStatusChange={
//                   setFriendshipStatus
//                 }
//               />
//             </div>

//             <div className="mt-4">
//               <Link
//                 href="/lobby"
//                 className="underline"
//               >
//                 Return to lobby
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }