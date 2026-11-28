"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProfileImage from "./ProfileImage";
import FriendRequestsPanel from "../friends/FriendsRequestPanel";
import { useLanguage } from "../language/LanguageProvider";

import { getAboutFriends, getAboutTrophies } from "../../../lib/about-api";
import {
  getMyGameStatistics,
  type UserGameStatisticDto,
  type UserProfileResponse,
} from "../../../lib/profile-api";

type StatisticsState =
  | { status: "loading" }
  | { status: "success"; data: UserGameStatisticDto | null }
  | { status: "error"; message: string };

export default function MainProfile({
  profile,
}: {
  profile: UserProfileResponse;
}) {
  const { dictionary } = useLanguage();
  const { tagId, createdAt, user_profile: details } = profile;
  const joinedDate = new Date(createdAt).toLocaleDateString();

  const [stats, setStats] = useState<StatisticsState>({ status: "loading" });

  const [friendList, setFriendList] = useState<
    Awaited<ReturnType<typeof getAboutFriends>> | null
  >(null);
  const [trophies, setTrophies] = useState<
    Awaited<ReturnType<typeof getAboutTrophies>> | null
  >(null);
  const [friendsError, setFriendsError] = useState("");
  const [trophiesError, setTrophiesError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setStats({ status: "loading" });
    setFriendList(null);
    setTrophies(null);
    setFriendsError("");
    setTrophiesError("");

    // Reuse the same statistics helper as the Statistics tab.
    void getMyGameStatistics()
      .then((data) => {
        if (!signal.aborted) setStats({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (signal.aborted) return;

        setStats({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load player statistics.",
        });
      });

    void getAboutFriends(signal)
      .then((data) => {
        if (!signal.aborted) setFriendList(data);
      })
      .catch(() => {
        if (!signal.aborted) setFriendsError("Unable to load friends.");
      });

    void getAboutTrophies(signal)
      .then((data) => {
        if (!signal.aborted) setTrophies(data);
      })
      .catch(() => {
        if (!signal.aborted) setTrophiesError("Unable to load trophies.");
      });

    return () => controller.abort();
  }, [tagId]);

  const statistics = stats.status === "success" ? stats.data : null;

  let winRate = "—";

  if (statistics) {
    const { matchPlayed, totalMatchesWon } = statistics;

    winRate =
      matchPlayed === 0
        ? "0%"
        : `${((totalMatchesWon / matchPlayed) * 100).toFixed(1)}%`;
  }

  return (
    <section className="content active">
      <div className="blogbox profile-card">
        <ProfileImage
          className="large-profile-image"
          imageUrl={details?.avatarUrl}
        />

        <div className="profile-details">
          <div className="responsive-table-wrap">
            {stats.status === "loading" && (
              <p role="status">Loading player statistics…</p>
            )}

            {stats.status === "error" && (
              <p role="alert">{stats.message}</p>
            )}

            <table className="aboutme">
              <tbody>
                <tr>
                  <td>{dictionary.profile.joined}: {joinedDate}</td>
                  <td>{dictionary.profile.level}: {statistics?.level ?? "—"}</td>
                  <td>{dictionary.profile.status}: —</td>
                </tr>

                <tr>
                  <td>
                    {dictionary.profile.matchesPlayed}:{" "}
                    {statistics?.matchPlayed ?? "—"}
                  </td>
                  <td>
                    {dictionary.profile.roundsWon}:{" "}
                    {statistics?.totalHandsWon ?? "—"}
                  </td>
                  <td>{dictionary.profile.winRate}: {winRate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <br />
          <hr />
          <br />

          <div>
            {dictionary.profile.signature}:{" "}
            {details?.signature?.trim() || "No signature"}
          </div>
        </div>
      </div>

      <div className="blogbox collections-card">
        <div className="collection-row">
          <div>{dictionary.profile.friends}{friendList ? ` (${friendList.total})` : ""}:</div>

          {friendsError && <p role="alert">{friendsError}</p>}
          {!friendList && !friendsError && (
            <p role="status">Loading friends…</p>
          )}
          {friendList?.total === 0 && <p>{dictionary.common.nofriends}</p>}

          <div className="iconspan flex flex-wrap gap-2">
            {friendList?.friends.map((friend) => {
              const name = friend.displayName?.trim() || friend.tagId || "Player";
              const avatar = (
                <ProfileImage
                  className="h-full w-full"
                  imageUrl={friend.avatarUrl}
                />
              );

              return friend.tagId ? (
                <Link
                  key={friend.userId}
                  href={`/profile/${encodeURIComponent(friend.tagId)}`}
                  className="small-icon block"
                  aria-label={`View ${name}'s profile`}
                  title={name}
                >
                  {avatar}
                </Link>
              ) : (
                <div key={friend.userId} className="small-icon" title={name}>
                  {avatar}
                </div>
              );
            })}
          </div>
        </div>

        <div className="collection-row">
          <div>{dictionary.common.trophies}:</div>

          {trophiesError && <p role="alert">{trophiesError}</p>}
          {!trophies && !trophiesError && (
            <p role="status">Loading trophies…</p>
          )}
          {trophies?.length === 0 && <p>{dictionary.common.notrophies}</p>}

          <div className="iconspan flex flex-wrap gap-2">
            {trophies?.map(({ trophy }) => (
              <div key={trophy.id} className="small-icon" title={trophy.name}>
                {trophy.imageUrl ? (
                  <img
                    src={trophy.imageUrl}
                    alt={trophy.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span role="img" aria-label={trophy.name}>
                    🏆
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <FriendRequestsPanel />
    </section>
  );
}

// import Image from "next/image";
// import Link from "next/link";

// import ProfileImage from "./ProfileImage";
// import { useLanguage } from "../language/LanguageProvider";

// import type {
//   UserProfileResponse,
// } from "../../../lib/profile-api";

// import {
//   getMyGameStatistics,
//   type UserGameStatisticDto,
// } from "../../../lib/profile-api";


// // import defaultProfilePic from "";
// import iconLogo from "../../../assets/iconLogo.svg";

// import FriendRequestsPanel from "../friends/FriendsRequestPanel";
// import { useEffect, useState } from "react";
// // hard coded still have no stats
// const mockStatistics = {
//   level: 1,
//   status: "Online",
//   matchesPlayed: 0,
//   roundsWon: 0,
//   winRate: "0%",
// };

// import { getAboutFriends, getAboutTrophies } from "../../../lib/about-api";

// export default function MainProfile({
//   profile,

// }: {
//   profile: UserProfileResponse;
// }) {
//   const joinedDate = new Date(
//     profile.createdAt,
//   ).toLocaleDateString();

//   const { dictionary } = useLanguage();
//   //player stats
 
//   const tagId = profile.tagId;

//   const [friendList, setFriendList] = useState<
//     Awaited<ReturnType<typeof getAboutFriends>> | null
//   >(null);
//   const [trophies, setTrophies] = useState<
//     Awaited<ReturnType<typeof getAboutTrophies>> | null
//   >(null);
//   const [friendsError, setFriendsError] = useState("");
//   const [trophiesError, setTrophiesError] = useState("");

  

//   useEffect(() => {
//     const controller = new AbortController();
//     const { signal } = controller;

//     setFriendList(null);
//     setTrophies(null);
//     setFriendsError("");
//     setTrophiesError("");
    

//     void getAboutFriends(signal)
//       .then((data) => {
//         if (!signal.aborted) setFriendList(data);
//       })
//       .catch(() => {
//         if (!signal.aborted) setFriendsError("Unable to load friends.");
//       });

//     void getAboutTrophies(signal)
//       .then((data) => {
//         if (!signal.aborted) setTrophies(data);
//       })
//       .catch(() => {
//         if (!signal.aborted) setTrophiesError("Unable to load trophies.");
//       });

//     return () => controller.abort();
//   }, [tagId]);
//   return (
//     <section className="content active">
//       <div className="blogbox profile-card">
//         <ProfileImage
//           className="large-profile-image"
//           imageUrl={
//             profile.user_profile?.avatarUrl
//           }
//         />

//         <div className="profile-details">
//           <div className="responsive-table-wrap">
//             <table className="aboutme">
//               <tbody>
//                 <tr>
//                   <td>
//                     {dictionary.profile.joined}: {joinedDate}
//                   </td>

//                   <td>
//                     {dictionary.profile.level}:{" "}
//                     {mockStatistics.level}
//                   </td>

//                   <td>
//                     {dictionary.profile.status}:{" "}
//                     {mockStatistics.status}
//                   </td>
//                 </tr>

//                 <tr>
//                   <td>
//                     {dictionary.profile.matchesPlayed}:{" "}
//                     {
//                       mockStatistics.matchesPlayed
//                     }
//                   </td>

//                   <td>
//                     {dictionary.profile.roundsWon}:{" "}
//                     {
//                       mockStatistics.roundsWon
//                     }
//                   </td>

//                   <td>
//                     {dictionary.profile.winRate}:{" "}
//                     {mockStatistics.winRate}
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//           <br />

//           <hr />

//           <br />

//           <div>
//             {dictionary.profile.signature}:{" "}
//             {profile.user_profile?.signature ??
//               "No signature"}
//           </div>
//         </div>
//       </div>

//       {/* <div className="blogbox collections-card">
//         <IconCollection
//           title="Friends"
//           image={`/img/defaultProfilePic.svg`}
//         />

//         <IconCollection
//           title="Trophies"
//           image={iconLogo}
//         />
//       </div>
//       <FriendRequestsPanel /> */}
//       <div className="blogbox collections-card">
//         <div className="collection-row">
//           <div>Friends{friendList ? ` (${friendList.total})` : ""}:</div>

//           {friendsError && <p role="alert">{friendsError}</p>}
//           {!friendList && !friendsError && <p role="status">Loading friends…</p>}
//           {friendList?.total === 0 && <p>No friends yet.</p>}

//           <div className="iconspan flex flex-wrap gap-2">
//             {friendList?.friends.map((friend) => {
//               const name = friend.displayName?.trim() || friend.tagId || "Player";
//               const avatar = (
//                 <ProfileImage className="h-full w-full" imageUrl={friend.avatarUrl} />
//               );

//               return friend.tagId ? (
//                 <Link
//                   key={friend.userId}
//                   href={`/profile/${encodeURIComponent(friend.tagId)}`}
//                   className="small-icon block"
//                   aria-label={`View ${name}'s profile`}
//                   title={name}
//                 >
//                   {avatar}
//                 </Link>
//               ) : (
//                 <div key={friend.userId} className="small-icon" title={name}>
//                   {avatar}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         <div className="collection-row">
//           <div>Trophies:</div>

//           {trophiesError && <p role="alert">{trophiesError}</p>}
//           {!trophies && !trophiesError && <p role="status">Loading trophies…</p>}
//           {trophies?.length === 0 && <p>No trophies unlocked yet.</p>}

//           <div className="iconspan flex flex-wrap gap-2">
//             {trophies?.map(({ trophy }) => (
//               <div key={trophy.id} className="small-icon" title={trophy.name}>
//                 {trophy.imageUrl ? (
//                   <img
//                     src={trophy.imageUrl}
//                     alt={trophy.name}
//                     className="h-full w-full object-contain"
//                   />
//                 ) : (
//                   <span role="img" aria-label={trophy.name}>🏆</span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//       <FriendRequestsPanel/>
//     </section>
//   );
// }

// function IconCollection({
//   title,
//   image,
// }: {
//   title: string;
//   image: string;
// }) {
//   return (
//     <div className="collection-row">
//       <div>{title}:</div>

//       <div className="iconspan">
//         {[0, 1, 2, 3, 4].map(
//           (index) => (
//             <div
//               className="small-icon"
//               key={index}
//             >
//               <Image
//                 src={image}
//                 alt=""
//                 fill
//                 sizes="64px"
//               />
//             </div>
//           ),
//         )}
//       </div>
//     </div>
//   );
// }

