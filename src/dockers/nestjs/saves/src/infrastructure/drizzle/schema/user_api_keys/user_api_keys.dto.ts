import z from "zod";
import { userApiKeysDatabaseSchema } from "./user_api_keys.schema.js";
import { ApiProperty } from "@nestjs/swagger";

type test = z.infer<typeof userApiKeysDatabaseSchema.select>

export class UserApiKeyDto implements test {

    @ApiProperty({
        description: "id of the api key in database"
    })
    id: string;

    @ApiProperty({
        description: "user id that own this api key"

    })
    userId: string;

    @ApiProperty({
        description: "the name of the key"

    })
    keyName: string;

    @ApiProperty({
        description: "the prefix of the key. used for displayed on request"

    })
    keyPrefix: string;

    @ApiProperty({
        description: "the actual key hashed"

    })
    keyHashed: string;

    @ApiProperty({
        description: "whether this key is revoked or not"
    })
    isRevoked: boolean;

    @ApiProperty({
        description: "the date this api was created"
    })
    createdAt: Date;

}