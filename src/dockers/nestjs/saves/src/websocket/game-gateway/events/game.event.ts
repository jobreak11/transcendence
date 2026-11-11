
export function event_game_namespace() {
  return `game`;
}

export const event_game_start = {
  to_server() {
    return `${event_game_namespace()}:start:to_server`
  },
  to_client() {
    return `${event_game_namespace()}:start:to_client`
  },
}

export const event_game_players_loaded = {
  to_server() {
    return `${event_game_namespace()}:players_loaded:to_server`
  },
  to_client() {
    return `${event_game_namespace()}:players_loaded:to_client`
  },
}
