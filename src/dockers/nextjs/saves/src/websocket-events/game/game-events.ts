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

  export namespace players_loaded {
    const players_loaded_namespace = `${game_event_namespace}:players_loaded`

    export namespace to_server {
      export const event_name = `${players_loaded_namespace}:to_server`
      export interface payload {
        tableSessionId: string;
      }
    }

    export namespace to_client {
      export const event_name = `${players_loaded_namespace}:to_client`
      export interface payload {
        tableSessionId: string;
        readyCount: number;
        playerCount: number;
        allPlayersLoaded: boolean;
        shouldAutoStartFirstHand: boolean;
      }
    }
  }

}