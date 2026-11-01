import 'ioredis'
import { string } from 'zod';

declare module 'ioredis' {
  interface Redis {
    lobbyRoomCreate(
      userGameLobbyKey: string,
      allLobbyListsKey: string,
      LobbyRoomMax: number,
      newLobbyPinId: string,
    ): Promise<number>;

    lobbyRoomJoin(
      userGameLobbyKey: string,
      allLobbyListsKey: string,
      spectatorMemberListKey: string,
      playerMemberListKey: string,
      lobbyGameSettingsKey: string,
      lobbyGeneralSettingsKey: string,
      isSpectator: "true" | "false",
      joinUserId: string,
      password: string,
      lobbyPinId: string,
      joinedAt: string
    ): Promise<number>;

    lobbyRoomLeave(
      playerMemberListKey: string,
      spectatorMemberListKey: string,
      allLobbyListKey: string,
      userGameLobbyKey: string,
      LobbygeneralSettingsKey: string,
      lobbyGameSettingsKey: string,
      leaveUserId: string,
      lobbyPinId: string,
    ): Promise<number>;

    lobbyRoomSetStatus(
      allLobbyListKey: string,
      generalSettingsKey: string,
      lobbyPinId: string,
      setStatus: string
    ): Promise<number>;
  }

}