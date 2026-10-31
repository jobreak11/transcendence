
# Websocket for frontend tutorial

- our front end use socket-io client as the main library
  to connect with webscoket from backend. and we need a way to work together

## Concepts

There are concepts that frontend need to know to understand how to work with socket.io websocket, and also some conventions so frontend and backend can collaborate with ease.

### Events

Events are some kinds of label attached to the websocket payload to tell what this payload what the client to do.
for example the message event should mean the messsage payload for client to receive.
```typescript
socket.on('onChatMessage', handleIncomingMessage);

return () => {
  socket.off('onChatMessage', handleIncomingMessage);
};
```

and also when client needs to send something back through websocket. client must sends through <b>event</b> also.

```typescript
socket.emit('newChatMessage', {
  chatRoomId: activeSendRoomId,
  message: inputText.trim(),
});
```

## Conventions to work with backend

### What frontend need to know to work on websocket
1. all the <b>event names</b> that client needs to listen or send back to
2. the <b>DTOs/Interfaces</b> so frontend will know what they need to send. and what they will get from the response

### my conventions

take this chat event for example

1. first you would want to know the event to receive
2. you would want to know the payload when you send/receive

```typescript
export namespace ChatEvent {
  const chat_namespace = `${main_event_namespace}:chat`

  export namespace message {
    const message_namespace = `${chat_namespace}:message`
    export namespace to_client {
      export const event_name = `${message_namespace}:to_client`


      export interface payload {
        chatRoomId: string | null;
        messageText: string;
      }
    }

    export namespace to_server {
      export const event_name = `${message_namespace}:to_server`

      export enum ChatMessageType {
        USER_MESSAGE = "USER_MESSAGE",
        SYSTEM_MESSAGE = "SYSTEM_MESSAGE"
      }

      export interface payload {
        chatRoomId: string | null;
        createdAt: Date;
        type: ChatMessageType;
        userId: string | null;
        messageText: string;
      }
    }

  }

  // example usage (pseudocode)
  socket.on(ChatEvent.message.to_client.eventname, {...}: ChatEvent.message.to_client.payload);

  // or maybe

  socket.emit(ChatEvent.message.to_server.eventname, {...}: ChatEvent.message.to_server.payload);

}

```

I hope this convention will help the frontend to wotk with socket.io websocket easier
