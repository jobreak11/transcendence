import Image from "next/image";
import ProfileImage from "./ProfileImage";
import defaultProfilePic from "../../../public/defaultProfilePic.svg"
import { useLanguage } from "../language/LanguageProvider";

const matches = [
  { mode: "Casual", result: "Loss", rounds: "2/7", points: "" },
  { mode: "Ranked", result: "Win", rounds: "5/6", points: "Points: +1" },
];

export default function MatchHistory() {
  const { dictionary } = useLanguage();
  return (
    <section className="content active">
      <div className="blogbox history-card">
        {matches.map((match) => (
          <div className="history-entry" key={match.mode}>
            <ProfileImage className="history-avatar" />
            <div className="responsive-table-wrap history-table-wrap">
              <table className="history-table">
                <tbody>
                  <tr>
                    <td>{dictionary.history.time}: TBD</td>
                    <td>{dictionary.history.mode}: {match.mode}</td>
                    <td>{dictionary.history.enemy}: TBD</td>
                  </tr>
                  <tr>
                    <td>{dictionary.history.results}: {match.result}</td>
                    <td>{dictionary.history.rounds}: {match.rounds}</td>
                    <td>{dictionary.history.points}: {match.points}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="history-avatar">
              <Image
                src={defaultProfilePic}
                alt="Opponent"
                fill
                sizes="100px"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
