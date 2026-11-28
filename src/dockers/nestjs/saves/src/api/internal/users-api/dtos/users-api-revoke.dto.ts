import { ApiProperty } from "@nestjs/swagger";
import z from "zod";

export const userApisRevokeSchema = z.object({
    rawApiKey: z.string().min(1),
})

type test = z.infer<typeof userApisRevokeSchema>;

export class UsersApiRevokeDto implements test {

    @ApiProperty({
        description: "the target api key to remove"
    })
    rawApiKey: string;
}