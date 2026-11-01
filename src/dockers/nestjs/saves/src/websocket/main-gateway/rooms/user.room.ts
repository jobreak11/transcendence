import { room_main_namespace } from "./main.room.js";

// private room per one and only for one each user
export function room_main_private_user(userId: string) {
  return `${room_main_namespace}:private:user:${userId}`
}