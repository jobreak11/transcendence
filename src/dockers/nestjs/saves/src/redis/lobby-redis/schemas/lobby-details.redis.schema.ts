import z from "zod";

export enum LobbyRoomStatus {
  // creating meaning the room is in the initialization process
  // and cannot join yet both player and spectator
  UNAVAILABLE = 'UNAVAILABLE',

  // user can join as player/spectator member when the lobby is waiting
  WAITING = 'WAITING',

  // user cannot join as player to the room that is already playing but
  // can join as spectator
  PLAYING = 'PLAYING'
}

const baseLobbyDetailsSchema = z.object({
  roomPinId: z.string(),
  createdAt: z.coerce.date(),
  createdByUserId: z.uuid(),
  hostUserId: z.uuid(),
  roomStatus: z.enum(LobbyRoomStatus),
  currentPlayerCount: z.int(),
  currentSpectatorCount: z.int(),
  chatRoomId: z.uuid(),
  gameRoomId: z.uuid().nullable()
})

const fullLobbyDetailsSchema = z.object({
  ...baseLobbyDetailsSchema.shape,
}).partial({currentSpectatorCount: true})

const insertLobbyDetailsSchema = z.object({
  ...baseLobbyDetailsSchema.shape,
  createdAt: baseLobbyDetailsSchema.shape.createdAt.default(new Date()),
  roomStatus: baseLobbyDetailsSchema.shape.roomStatus.default(LobbyRoomStatus.WAITING),
  currentPlayerCount: baseLobbyDetailsSchema.shape.currentPlayerCount.default(0),
  currentSpectatorCount: baseLobbyDetailsSchema.shape.currentSpectatorCount.default(0),
  gameRoomId: baseLobbyDetailsSchema.shape.gameRoomId.default(null),
  hostUserId: baseLobbyDetailsSchema.shape.hostUserId.optional(),
}).transform((data) => {
  const newHostUserId = data.hostUserId ?? data.createdByUserId
  return {
    ...data,
    hostUserId: newHostUserId
  }
})


const inputLobbyDetailsSchema = baseLobbyDetailsSchema.pick({createdByUserId: true})


export namespace LobbyDetails {

  export type input = z.input<typeof inputLobbyDetailsSchema>;

  export const schema = {
    input: inputLobbyDetailsSchema,
    full: fullLobbyDetailsSchema,
    insert: insertLobbyDetailsSchema
  };
}

