import { room_main_namespace } from "./main.room.js";

function room_main_chat_namespace() {
  return `${room_main_namespace()}:chat`

}

export function room_main_chat_specific(chatRoomId: string) {
  return `${room_main_chat_namespace()}:specific:${chatRoomId}`
}

// dont need
//export function room_main_chat_public() {
//  return `${room_main_chat_namespace()}:public`
//}

export function room_main_chat_lobby(lobbyPinId: string) {
  return `${room_main_chat_namespace()}:lobby:${lobbyPinId}`

}