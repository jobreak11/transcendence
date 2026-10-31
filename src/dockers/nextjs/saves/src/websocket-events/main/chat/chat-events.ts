import { main_event_namespace } from "../main-event.namespace"



export namespace ChatEvent {
  const chat_namespace = `${main_event_namespace}:chat`

  export namespace message {
    const message_namespace = `${chat_namespace}:message`
    export namespace to_client {
      export const event_name = `${message_namespace}:to_client`

      export enum ChatMessageType {
        USER_MESSAGE = "USER_MESSAGE",
        SYSTEM_MESSAGE = "SYSTEM_MESSAGE"
      }

      export interface payload {
        chatRoomId: string | null;
        createdAt: Date;
        type: ChatMessageType;
        userId: string | null;
        messageText: string;
      }
    }

    export namespace to_server {
      export const event_name = `${message_namespace}:to_server`

      export interface payload {
        chatRoomId: string | null;
        messageText: string;
      }
    }

  }
}
