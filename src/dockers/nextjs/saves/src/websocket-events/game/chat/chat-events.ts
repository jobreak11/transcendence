import { game_event_namespace } from "../game-event.namespace";

const game_chat_namespace = `${game_event_namespace}:chat`;

export interface GameChatMessage {
  id: string;
  tableSessionId: string;
  playerId: string;
  messageText: string;
  createdAt: string;
}

export namespace GameChatEvent {
  export namespace history {
    const history_namespace = `${game_chat_namespace}:history`;

    export namespace to_server {
      export const event_name = `${history_namespace}:to_server`;
      export interface payload {
        tableSessionId: string;
      }
    }

    export namespace to_client {
      export const event_name = `${history_namespace}:to_client`;
      export interface payload {
        ok: boolean;
        messages?: GameChatMessage[];
        message?: string;
      }
    }
  }

  export namespace message {
    const message_namespace = `${game_chat_namespace}:message`;

    export namespace to_server {
      export const event_name = `${message_namespace}:to_server`;
      export interface payload {
        tableSessionId: string;
        messageText: string;
      }
    }

    export namespace to_client {
      export const event_name = `${message_namespace}:to_client`;
      export type payload = GameChatMessage;
    }
  }
}
