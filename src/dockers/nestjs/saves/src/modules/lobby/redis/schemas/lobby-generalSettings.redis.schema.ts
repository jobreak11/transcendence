import z, { date } from "zod";

export enum LobbyRoomType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

const CATCH_PHRASE_LIMIT = {
  MIN: 1,
  MAX: 100
}

const PASSWORD_LIMIT = {
  MIN: 4,
  MAX: 100
}

const baseLobbyGeneralSettingsSchema = z.object({
  catchPhrase: z.string().min(CATCH_PHRASE_LIMIT.MIN).max(CATCH_PHRASE_LIMIT.MAX).nullable(),
  roomType: z.enum(LobbyRoomType),
  password: z.string().min(PASSWORD_LIMIT.MIN).max(PASSWORD_LIMIT.MAX).nullable(),
})

const inputLobbyGeneralSetingsSchema = z.object({
  ...baseLobbyGeneralSettingsSchema.shape,
  catchPhrase: baseLobbyGeneralSettingsSchema.shape.catchPhrase.default(null),
  password: baseLobbyGeneralSettingsSchema.shape.password.default(null),
  roomType: baseLobbyGeneralSettingsSchema.shape.roomType.default(LobbyRoomType.PUBLIC)
}).refine((data) => {
  if (data.roomType === LobbyRoomType.PRIVATE && data.password === null) {
    return false
  }
  return true
})

export namespace LobbyGeneralSettings {
  export const schema = {
    full: baseLobbyGeneralSettingsSchema,
    input: inputLobbyGeneralSetingsSchema
  }
}
