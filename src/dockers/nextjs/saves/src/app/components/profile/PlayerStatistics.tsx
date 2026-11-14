import RadarChart from "./RadarChart";

import { mockPlayerStatisticsData } from "../../../lib/mock-data";
import { useLanguage } from "../language/LanguageProvider";

export default function PlayerStatistics() {
  const { dictionary } = useLanguage();
  return (
    <section className="content active">
      <div className="blogbox">
        <div className="full-card-column">
          <div className="responsive-table-wrap">
            <table className="statistics-table">
              <tbody>
                <tr>
                  <td>
                    {dictionary.profile.joined}:{" "}
                    {mockPlayerStatisticsData.joinedAt}
                  </td>

                  <td>
                    {dictionary.profile.level}:{" "}
                    {mockPlayerStatisticsData.level}
                  </td>

                  <td>
                    {dictionary.profile.likes}:{" "}
                    {mockPlayerStatisticsData.likes}
                  </td>
                </tr>

                <tr>
                  <td>
                    {dictionary.profile.matchesPlayed}:{" "}
                    {
                      mockPlayerStatisticsData.matchesPlayed
                    }
                  </td>

                  <td>
                    {dictionary.profile.roundsWon}:{" "}
                    {mockPlayerStatisticsData.roundsWon}
                  </td>

                  <td>
                    {dictionary.profile.winRate}:{" "}
                    {mockPlayerStatisticsData.winRate}
                  </td>
                </tr>

                <tr>
                  <td>
                    {dictionary.profile.highestGain}:{" "}
                    {mockPlayerStatisticsData.highestGain}
                  </td>

                  <td>
                    {dictionary.profile.highestLoss}:{" "}
                    {mockPlayerStatisticsData.highestLoss}
                  </td>

                  <td>
                    {dictionary.profile.highestRank}:{" "}
                    {mockPlayerStatisticsData.highestBank}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <br />
          <hr />
          <br />

          <div className="chart-panel">
            {dictionary.profile.playstyle}
            <RadarChart />
          </div>
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
