import { useEffect, useState } from "react";

// import RadarChart from "./RadarChart";

import {
  getMyGameStatistics,
  type UserGameStatisticDto,
  type UserProfileResponse,
} from "../../../lib/profile-api";
import { useLanguage } from "../language/LanguageProvider";

export default function PlayerStatistics({
  profile,
}: {
  profile: UserProfileResponse;
}) {
  const { dictionary } = useLanguage();
  const [statistics, setStatistics] =
    useState<UserGameStatisticDto | null>(null);
  const [setHasNoGameStatistics] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getMyGameStatistics()
      .then((result) => {
        if (isMounted) {
          if (result === null) {
            setHasNoGameStatistics(true);
          } else {
            setStatistics(result);
          }
        }
      })
      .catch((loadError: unknown) => {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load player statistics.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const joinedAt = new Date(
    profile.createdAt,
  ).toLocaleDateString();

  const winRate =
    !statistics || statistics.matchPlayed === 0
      ? "0%"
      : `${(
          (statistics.totalMatchesWon /
            statistics.matchPlayed) *
          100
        ).toFixed(1)}%`;

  return (
    <section className="content active">
      <div className="blogbox">
        <div className="full-card-column">
          <div className="responsive-table-wrap">
            {isLoading ? (
              <p role="status">Loading player statistics...</p>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : (
              <table className="statistics-table">
                <tbody>
                  <tr>
                    <td>
                      {dictionary.profile.joined}:{" "}
                      {joinedAt}
                    </td>

                    <td>
                      {dictionary.profile.level}:{" "}
                      {statistics?.level ?? 0}
                    </td>

                    {/* <td>
                      {dictionary.profile.likes}:{" "}
                    </td> */}
                  </tr>

                  <tr>
                    <td>
                      {dictionary.profile.matchesPlayed}:{" "}
                      {statistics?.matchPlayed ?? 0}
                    </td>

                    <td>
                      {dictionary.profile.roundsWon}:{" "}
                      {statistics?.totalHandsWon ?? 0}
                    </td>

                    <td>
                      {dictionary.profile.winRate}:{" "}
                      {winRate}
                    </td>
                  </tr>

                  <tr>
                    {/* <td>
                      {dictionary.profile.highestGain}:{" "}
                    </td> */}

                    {/* <td>
                      {dictionary.profile.highestLoss}:{" "}
                    </td> */}

                    <td>
                      {dictionary.profile.highestRank}:{" "}
                      {statistics?.rankPoint ?? 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <br />
          <hr />
          <br />

          {/* <div className="chart-panel">
            {dictionary.profile.playstyle}
            <RadarChart />
          </div> */}
        </div>
      </div>
    </section>
  );
}

// import RadarChart from "./RadarChart";
// import type { Profile } from "../../../lib/types";

// export default function PlayerStatistics({ profile }: { profile: Profile }) {
//   return (
//     <section className="content active">
//       <div className="blogbox">
//         <div className="full-card-column">
//           <div className="responsive-table-wrap">
//             <table className="statistics-table">
//               <tbody>
//                 <tr>
//                   <td>Join: {profile.joinedAt}</td>
//                   <td>Level: {profile.level}</td>
//                   <td>Likes: NaN</td>
//                 </tr>
//                 <tr>
//                   <td>Matches Played: {profile.matchesPlayed}</td>
//                   <td>Rounds Won: {profile.roundsWon}</td>
//                   <td>Win Rate: {profile.winRate}</td>
//                 </tr>
//                 <tr>
//                   <td>Highest Gain: NaN</td>
//                   <td>Highest Loss: NaN</td>
//                   <td>Highest Bank: NaN</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//           <br></br>
//           <hr />
//           <br></br>
//           <div className="chart-panel">
//             Playstyle
//             <RadarChart />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
