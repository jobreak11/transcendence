import { game_event_namespace } from "./game-event.namespace";

export namespace GameEvent {

  export namespace start {
    const start_namespace = `${game_event_namespace}:start`
    export namespace to_server {
      export const event_name = `${start_namespace}:to_server`
      export interface payload {
        tableSessionId: string;
      }
    }
    export namespace to_client {
      export const event_name = `${start_namespace}:to_client`

    }
  }

  

}