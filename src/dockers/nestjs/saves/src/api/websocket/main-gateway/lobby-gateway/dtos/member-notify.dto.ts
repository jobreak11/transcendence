
export enum LobbyMemberNofifyType {

  // event to notify that new member has join the lobby
  MEMBER_JOIN = "MEMBER_JOIN",

  // event to notify that a member has leave the lobby
  MEMBER_LEAVE = "MEMBER_LEAVE",

  // change role is to between player or spectator when in lobby
  MEMBER_CHANGE_ROLE = "MEMBER_CHANGE_ROLE",

  // notify that the host of the room has changed
  MEMBER_CHANGE_HOST = "MEMBER_CHANGE_HOST",

}

export enum LobbyMemberNotifyRole {
  PLAYER = "PLAYER",
  SPECTATOR = "SPECTATOR"
}

export interface LobbyMemberNotifyToClientDto {
  status: LobbyMemberNofifyType;
  lobbyPinId: string;
  userId: string;
  role: LobbyMemberNotifyRole;
}