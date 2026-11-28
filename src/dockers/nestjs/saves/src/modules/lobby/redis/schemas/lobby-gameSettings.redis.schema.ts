import z from "zod";

export enum GameSettingFormat {
  BEGINNER = "BEGINNER",
  PRO = "PRO",
  TURBO = "TURBO",
  CUSTOM = "CUSTOM"
}

export namespace GameSettings {
  export const formatChips = {BEGINNER : 2000 , PRO: 5000, TURBO: 5000 };
  export const formatBB = {BEGINNER : 10, PRO: 50, TURBO: 100 };
  export const Ante = {BEGINNER: null, PRO: 5, TURBO: 10};

  export function anteFormula(startingChips: number, bigblind: number) {
    
  }
}



const BIG_BLIND_RATIO = {
  MIN : 5,
  MAX : 100
}

const STARTING_CHIPS = {
  MIN: 500,
  MAX: 5000
}

const PLAYER_LIMIT = {
  MIN: 2,
  MAX: 8,
  DEFAULT: 4
}

const SPEACTATOR_LIMIT = {
  MAX: 10
}

function checkFormatBigBlind(
  format?: GameSettingFormat | undefined ,
  startingChips?: number | undefined ,
  bigBlindValue?: number | undefined ,
): boolean {

  if (format === GameSettingFormat.CUSTOM) {
    if (startingChips === undefined || bigBlindValue === undefined) {
      return false
    }
    else {
      const bigBlindRatio = Math.floor((startingChips ?? 1) / (bigBlindValue ?? 1));
      if (bigBlindRatio > BIG_BLIND_RATIO.MAX || bigBlindRatio < BIG_BLIND_RATIO.MIN) { 
        return false;
      }
    }
  }
  if (startingChips !== undefined || bigBlindValue !== undefined) {
    return false;
  }

  return true
}

const baseLobbyGameSettingsSchema = z.object({
  maxPlayer: z.int().min(2).max(8),
  maxSpectator: z.int().min(0).max(10),
  format: z.enum(GameSettingFormat),
  startingChips: z.int().min(STARTING_CHIPS.MIN).max(STARTING_CHIPS.MAX),
  bigBlind: z.int().min(0),
  ante: z.int().min(0).nullable()
})


const inputLobbyGameSettingsSchema = z.strictObject({
  ...baseLobbyGameSettingsSchema.shape,
  maxPlayer: baseLobbyGameSettingsSchema.shape.maxPlayer.default(4),
  maxSpectator: baseLobbyGameSettingsSchema.shape.maxSpectator.default(0),
  format: baseLobbyGameSettingsSchema.shape.format.default(GameSettingFormat.BEGINNER),
  startingChips: baseLobbyGameSettingsSchema.shape.startingChips.optional(),
  bigBlind: baseLobbyGameSettingsSchema.shape.bigBlind.optional()
}).omit({ante: true})
.superRefine((data, ctx) => {
  if (checkFormatBigBlind(data.format, data.startingChips, data.bigBlind) === false) {
    ctx.addIssue({
      code: "custom",
      message: `only Custom format allowed to modify values: bigBlind value exceeds the ratio: => [ ${BIG_BLIND_RATIO.MIN} <= startingChips / bigBlind  <= ${BIG_BLIND_RATIO.MAX} ]`,
      path: ['format', 'startingChips', 'bigBlind']
    })
  }
})

const insertLobbyGameSettingsSchema = inputLobbyGameSettingsSchema
.safeExtend({
  ante: baseLobbyGameSettingsSchema.shape.ante.optional()
})
.transform((data) => {

  let newStartingChips: number = 1;
  let newBigBlind: number = 1;
  let newAnte: number | null = null;

  if (data.format === GameSettingFormat.BEGINNER) {
    newStartingChips = GameSettings.formatChips.BEGINNER
    newBigBlind = GameSettings.formatBB.BEGINNER
    newAnte = GameSettings.Ante.BEGINNER
  }
  else if (data.format === GameSettingFormat.TURBO) {
    newStartingChips = GameSettings.formatChips.TURBO
    newBigBlind = GameSettings.formatBB.TURBO
    newAnte = GameSettings.Ante.TURBO
  }
  else if (data.format === GameSettingFormat.PRO) {
    newStartingChips = GameSettings.formatChips.PRO
    newBigBlind = GameSettings.formatBB.PRO
    newAnte = GameSettings.Ante.PRO
  }
  else if (data.format === GameSettingFormat.CUSTOM) {
    if (data.startingChips) {
      newStartingChips = data.startingChips
    }
    if (data.bigBlind) {
      newBigBlind = data.bigBlind
    }

    newAnte = Math.floor(newBigBlind / 10);
  }

  return {
    ...data,
    startingChips: newStartingChips,
    bigBlind: newBigBlind,
    ante: newAnte
  }

})


export namespace LobbyGameSettings {

  export const schema = {
    full: baseLobbyGameSettingsSchema,
    input: inputLobbyGameSettingsSchema,
    insert: insertLobbyGameSettingsSchema
  }

}