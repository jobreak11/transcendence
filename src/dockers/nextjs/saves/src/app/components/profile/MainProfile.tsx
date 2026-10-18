import Image from "next/image";
import ProfileImage from "./ProfileImage";
import type { Profile } from "../../../lib/types";
import defaultProfilePic from "../../../public/defaultProfilePic.svg"
import iconLogo from "../../../public/iconLogo.svg"

export default function MainProfile({ profile }: { profile: Profile }) {
  return (
    <section className="content active">
      <div className="blogbox profile-card">
        <ProfileImage className="large-profile-image" />
        <div className="profile-details">
          <div className="responsive-table-wrap">
            <table className="aboutme">
              <tbody>
                <tr>
                  <td>Join: {profile.joinedAt}</td>
                  <td>Level: {profile.level}</td>
                  <td>Status: {profile.status}</td>
                </tr>
                <tr>
                  <td>Matches Played: {profile.matchesPlayed}</td>
                  <td>Rounds Won: {profile.roundsWon}</td>
                  <td>Win Rate: {profile.winRate}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <br></br>
          <hr />
          <br></br>
          <div>Signature: {profile.signature}</div>
        </div>
      </div>

      <div className="blogbox collections-card">
        <IconCollection title="Friends" image={defaultProfilePic} />
        <IconCollection title="Trophies" image={iconLogo} />
      </div>
    </section>
  );
}

function IconCollection({ title, image }: { title: string; image: string }) {
  return (
    <div className="collection-row">
      <div>{title}:</div>
      <div className="iconspan">
        {[0, 1, 2, 3, 4].map((index) => (
          <div className="small-icon" key={index}>
            <Image src={image} alt="" fill sizes="64px" />
          </div>
        ))}
      </div>
    </div>
  );
}
