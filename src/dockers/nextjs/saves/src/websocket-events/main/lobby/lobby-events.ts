import { main_event_namespace } from "../main-event.namespace";

export namespace LobbyEvent {
  const lobby_namespace = `${main_event_namespace}:lobby`

  export namespace ready {
    const ready_namespace = `${lobby_namespace}:user_ready`
    export namespace to_client {
      export const event_name = `${ready_namespace}:to_client`

      export interface payload {
        lobbyPinId: string;
        userId: string;
        isReady: boolean;
        createdAt: string;
      }
    }
    export namespace to_server {
      export const event_name = `${ready_namespace}:to_server`

      export interface payload {
        lobbyPinId: string;
      }
    }
  }

  export namespace game_started {
    const game_started_namespace = `${lobby_namespace}:game_started`
    export namespace to_client {
      export const event_name = `${game_started_namespace}:to_client`

      export interface payload {
        lobbyPinId: string;
        tableSessionId: string;
      }
    }
  }

  export namespace member_notify {
    const member_notify_namespace = `${lobby_namespace}:member_notify`
    export namespace to_client {
      export const event_name = `${member_notify_namespace}:to_client`

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

      export interface payload {
        status: LobbyMemberNofifyType;
        userId: string;
        lobbyPinId: string;
        role: LobbyMemberNotifyRole;

      }
    }
  }
}
