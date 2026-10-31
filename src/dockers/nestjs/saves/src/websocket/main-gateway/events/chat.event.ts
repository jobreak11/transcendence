import { event_main_namespace } from "./main.event.js";

function event_main_chat_namespace() {
  return `${event_main_namespace()}:chat`
}


// main:chat:message:to_server
export const event_main_chat_message = {
  to_server() {
    return `${event_main_chat_namespace()}:message:to_server`
  },
  to_client() {
    return `${event_main_chat_namespace()}:message:to_client`
  }
}

// join the websocket chat room to receive realtime notification
export const event_main_chat_event_notify = {

  to_server() {
    return `${event_main_chat_namespace()}:event_notify:to_server`
  },
  to_client() {
    return `${event_main_chat_namespace()}:event_notify:to_client`
  }
}

//export const event_main_chat_leave = {
//  to_server() {
//    return `${event_main_chat_namespace()}:leave:to_server`
//  },
//  to_client() {
//    return `${event_main_chat_namespace()}:leave:to_client`
//  }

//}

