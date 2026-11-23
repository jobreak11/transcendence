import { Module } from "@nestjs/common";
import { PublicUsersUserController } from "./public-users-user.controller.js";
import { PublicUsersService } from "./public-users.service.js";
import { InternalUsersService } from "../../internal/users/internal-users.service.js";
import { InternalUsersModule } from "../../internal/users/internal-users.module.js";
import { UserModule } from "../../../modules/user/user.module.js";
import { UsersApiModule } from "../../../modules/users-api/users-api.module.js";

@Module({
    imports: [
        InternalUsersModule,
        UserModule,
        UsersApiModule
    ],
    controllers: [
        PublicUsersUserController
    ],
    providers: [
        PublicUsersService
    ],
    exports: [
        PublicUsersService
    ]
})
export class PublicUsersModule {

}