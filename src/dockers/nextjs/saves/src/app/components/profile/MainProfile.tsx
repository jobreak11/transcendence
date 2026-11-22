import Image from "next/image";

import ProfileImage from "./ProfileImage";
import { useLanguage } from "../language/LanguageProvider";

import type {
  UserProfileResponse,
} from "../../../lib/profile-api";

import defaultProfilePic from "../../../public/defaultProfilePic.svg";
import iconLogo from "../../../public/iconLogo.svg";


// hard coded still have no stats
const mockStatistics = {
  level: 1,
  status: "Online",
  matchesPlayed: 0,
  roundsWon: 0,
  winRate: "0%",
};

export default function MainProfile({
  profile,
}: {
  profile: UserProfileResponse;
}) {
  const joinedDate = new Date(
    profile.createdAt,
  ).toLocaleDateString();

  const { dictionary } = useLanguage();

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

      <div className="blogbox collections-card">
        <IconCollection
          title="Friends"
          image={defaultProfilePic}
        />

        <IconCollection
          title="Trophies"
          image={iconLogo}
        />
      </div>
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
