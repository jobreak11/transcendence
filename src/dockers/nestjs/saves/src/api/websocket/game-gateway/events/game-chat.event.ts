import { event_game_namespace } from "./game.event.js";

const event_game_chat_namespace = `${event_game_namespace()}:chat`;

export interface EventGameChatMessage {
  id: string;
  tableSessionId: string;
  playerId: string;
  messageText: string;
  createdAt: string;
}

const event_game_chat_history_namespace = `${event_game_chat_namespace}:history`;
export const event_game_chat_history = {
  to_server() {
    return `${event_game_chat_history_namespace}:to_server`;
  },
  to_client() {
    return `${event_game_chat_history_namespace}:to_client`;
  },
};

const event_game_chat_message_namespace = `${event_game_chat_namespace}:message`;
export const event_game_chat_message = {
  to_server() {
    return `${event_game_chat_message_namespace}:to_server`;
  },
  to_client() {
    return `${event_game_chat_message_namespace}:to_client`;
  },
};
