import { main_event_namespace } from "../main-event.namespace";

export namespace LobbyEvent {
  const lobby_namespace = `${main_event_namespace}:lobby`

  export namespace ready {
    const ready_namespace = `${lobby_namespace}:ready`
    export namespace to_client {
      export const event_name = `${ready_namespace}:to_client`

      export interface payload {

      }
    }
    export namespace to_server {
      export const event_name = `${ready_namespace}:to_server`

      export interface payload {

      }
    }
  }
}