import { event_main_namespace } from "./main.event.js";

function event_main_lobby_namespace() {
  return `${event_main_namespace()}:lobby`
}

export const event_main_lobby_user_ready = {
  to_server() {
    return `${event_main_lobby_namespace}:user_ready:to_server`
  },
  to_client() {
    return `${event_main_lobby_namespace}:user_ready:to_client`
  }
}

export const event_main_lobby_member_notify = {
  to_client() {
    return `${event_main_lobby_namespace}:member_notify:to_client`
  }
}

