
export enum GameMemberNotifyType {
  MEMBER_JOIN = "MEMBER_JOIN",
  MEMBER_LEAVE = "MEMBER_LEAVE"
}

export enum GameMemberNotifyRole {
  SPECTATOR = "SPECTATOR",
  PLAYER = "PLAYER"
}

export interface GameMemberNotifyToClientDto {
  gameRoomId: string;
  userId: string;
  role: GameMemberNotifyRole;
  status: GameMemberNotifyType;
}

