import { Module } from "@nestjs/common";
import { PublicUsersUserController } from "./public-users-user.controller.js";
import { PublicUsersService } from "./public-users.service.js";

@Module({
    imports: [],
    controllers: [
        PublicUsersUserController
    ],
    providers: [
        PublicUsersService
    ],
})
export class PublicUsersModule {

}