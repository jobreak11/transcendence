import { event_main_namespace } from "./main.event.js";

function event_main_chat_namespace() {
  return `${event_main_namespace()}:chat`
}

export const event_main_chat = {
  from_client() {
    return `${event_main_chat_namespace()}:from_client`
  },
  to_client() {
    return `${event_main_chat_namespace()}:to_client`
  }
}

