import { room_main_namespace } from "./main.room.js";

function room_main_lobby_namespace() {
  return `${room_main_namespace()}:lobby`;
}

export function room_main_lobby_specific(lobbyPinId: string) {
  return `${room_main_lobby_namespace}:specific:${lobbyPinId}`
}