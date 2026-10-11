import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod"


export const JoinLobbySchema = z.object({
  lobbyPinId: z.string().min(6).max(6),
  isSpectator: z.boolean(),
  password: z.string().optional(),
})

type _JoinLobbyZodDtoBase = z.infer<typeof JoinLobbySchema>

export class JoinLobbyDto implements _JoinLobbyZodDtoBase {

  @ApiProperty({
    required: true
  })
  lobbyPinId: string;

  @ApiProperty({
    required: true
  })
  isSpectator: boolean;

  @ApiProperty({
    required: false
  })
  password?: string;
}