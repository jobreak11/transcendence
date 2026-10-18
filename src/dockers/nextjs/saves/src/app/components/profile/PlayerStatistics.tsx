import RadarChart from "./RadarChart";
import type { Profile } from "../../../lib/types";

export default function PlayerStatistics({ profile }: { profile: Profile }) {
  return (
    <section className="content active">
      <div className="blogbox">
        <div className="full-card-column">
          <div className="responsive-table-wrap">
            <table className="statistics-table">
              <tbody>
                <tr>
                  <td>Join: {profile.joinedAt}</td>
                  <td>Level: {profile.level}</td>
                  <td>Likes: NaN</td>
                </tr>
                <tr>
                  <td>Matches Played: {profile.matchesPlayed}</td>
                  <td>Rounds Won: {profile.roundsWon}</td>
                  <td>Win Rate: {profile.winRate}</td>
                </tr>
                <tr>
                  <td>Highest Gain: NaN</td>
                  <td>Highest Loss: NaN</td>
                  <td>Highest Bank: NaN</td>
                </tr>
              </tbody>
            </table>
          </div>
          <br></br>
          <hr />
          <br></br>
          <div className="chart-panel">
            Playstyle
            <RadarChart />
          </div>
        </div>
      </div>
    </section>
  );
}
