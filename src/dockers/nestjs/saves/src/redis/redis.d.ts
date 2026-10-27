import 'ioredis'
import { string } from 'zod';
import { CHAT_REDIS_MESSAGE_LIMIT } from './chat-redis/chat-redis.constants.ts';

declare module 'ioredis' {
  interface Redis {
    lobbyRoomCreate(
      allLobbyListsKey: string,
      LobbyRoomMax: number,
      newLobbyPinId: string,
    ): Promise<number>;

    lobbyRoomJoin(
      userLobbyListKey: string,
      allLobbyListsKey: string,
      spectatorMemberListKey: string,
      playerMemberListKey: string,
      lobbyGameSettingsKey: string,
      lobbyGeneralSettingsKey: string,

      isSpectator: "true" | "false",
      joinUserId: string,
      password: string,
      lobbyPinId: string,
      joinedAt: string,
      userLobbyListLimit: number,
    ): Promise<number>;

    lobbyRoomLeave(

      playerMemberListKey: string,
      spectatorMemberListKey: string,
      allLobbyListKey: string,
      userLobbyListKey: string,
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

    // ##############################################

    setWithLimitAdd(
      setKey: string,
      newElement: string,
      limit: number,
    ): Promise<number>;

    sortedSetFIFOWithLimitAdd(
      sortedSetKey: string,
      newElement: string,
      limit: number,
      score: number
    ): Promise<[string, string] | null>

    hsetOneIfKeyAndFieldExist(
      hkey: string,
      field: string,
      value: string
    ): Promise<number>;

    writeChatRoomMessage(
      chatRoomKey: string,
      chatMessagelistKey: string,
      newMessage: string , // bundled as JSON.stringtify
      limit: number = CHAT_REDIS_MESSAGE_LIMIT
    ): Promise<number>

  }

}