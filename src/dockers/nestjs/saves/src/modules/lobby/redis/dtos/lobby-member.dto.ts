
enum lobbyMemberRole {
  PLAYER = "PLAYER",
  SPECTATOR = "SPECTATOR",
}

const isHost: boolean = true;

// NOTE: when host leave lobby room
//     ***  oldest member will get promoted to HOST
//     ** specific rules dedicated to tournament.
//        - won't transfer host when the
//          host leave the tournament room
//     **** OLDEST PLAYER MEMBER ONLY

//  IF there is no player and no host in lobby room. destroy the lobby room
// - Host can disband the lobby room. the lobby room
//  will get destroyed


