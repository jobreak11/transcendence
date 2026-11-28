import Image from "next/image";
import Link from "next/link";

import ProfileImage from "./ProfileImage";
import { useLanguage } from "../language/LanguageProvider";

import type {
  UserProfileResponse,
} from "../../../lib/profile-api";

// import defaultProfilePic from "";
import iconLogo from "../../../assets/iconLogo.svg";

import FriendRequestsPanel from "../friends/FriendsRequestPanel";
import { useEffect, useState } from "react";
// hard coded still have no stats
const mockStatistics = {
  level: 1,
  status: "Online",
  matchesPlayed: 0,
  roundsWon: 0,
  winRate: "0%",
};

import { getAboutFriends, getAboutTrophies } from "../../../lib/about-api";

export default function MainProfile({
  profile,
}: {
  profile: UserProfileResponse;
}) {
  const joinedDate = new Date(
    profile.createdAt,
  ).toLocaleDateString();

  const { dictionary } = useLanguage();
  const tagId = profile.tagId;

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

    setFriendList(null);
    setTrophies(null);
    setFriendsError("");
    setTrophiesError("");

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
  return (
    <section className="content active">
      <div className="blogbox profile-card">
        <ProfileImage
          className="large-profile-image"
          imageUrl={
            profile.user_profile?.avatarUrl
          }
        />

        <div className="profile-details">
          <div className="responsive-table-wrap">
            <table className="aboutme">
              <tbody>
                <tr>
                  <td>
                    {dictionary.profile.joined}: {joinedDate}
                  </td>

                  <td>
                    {dictionary.profile.level}:{" "}
                    {mockStatistics.level}
                  </td>

                  <td>
                    {dictionary.profile.status}:{" "}
                    {mockStatistics.status}
                  </td>
                </tr>

                <tr>
                  <td>
                    {dictionary.profile.matchesPlayed}:{" "}
                    {
                      mockStatistics.matchesPlayed
                    }
                  </td>

                  <td>
                    {dictionary.profile.roundsWon}:{" "}
                    {
                      mockStatistics.roundsWon
                    }
                  </td>

                  <td>
                    {dictionary.profile.winRate}:{" "}
                    {mockStatistics.winRate}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <br />

          <hr />

          <br />

          <div>
            {dictionary.profile.signature}:{" "}
            {profile.user_profile?.signature ??
              "No signature"}
          </div>
        </div>
      </div>

      {/* <div className="blogbox collections-card">
        <IconCollection
          title="Friends"
          image={`/img/defaultProfilePic.svg`}
        />

        <IconCollection
          title="Trophies"
          image={iconLogo}
        />
      </div>
      <FriendRequestsPanel /> */}
      <div className="blogbox collections-card">
        <div className="collection-row">
          <div>Friends{friendList ? ` (${friendList.total})` : ""}:</div>

          {friendsError && <p role="alert">{friendsError}</p>}
          {!friendList && !friendsError && <p role="status">Loading friends…</p>}
          {friendList?.total === 0 && <p>No friends yet.</p>}

          <div className="iconspan flex flex-wrap gap-2">
            {friendList?.friends.map((friend) => {
              const name = friend.displayName?.trim() || friend.tagId || "Player";
              const avatar = (
                <ProfileImage className="h-full w-full" imageUrl={friend.avatarUrl} />
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
          <div>Trophies:</div>

          {trophiesError && <p role="alert">{trophiesError}</p>}
          {!trophies && !trophiesError && <p role="status">Loading trophies…</p>}
          {trophies?.length === 0 && <p>No trophies unlocked yet.</p>}

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
                  <span role="img" aria-label={trophy.name}>🏆</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <FriendRequestsPanel/>
    </section>
  );
}

function IconCollection({
  title,
  image,
}: {
  title: string;
  image: string;
}) {
  return (
    <div className="collection-row">
      <div>{title}:</div>

      <div className="iconspan">
        {[0, 1, 2, 3, 4].map(
          (index) => (
            <div
              className="small-icon"
              key={index}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="64px"
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

