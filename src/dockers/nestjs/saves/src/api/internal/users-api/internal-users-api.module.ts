import { Module } from "@nestjs/common";
import { UsersApiModule } from "../../../modules/users-api/users-api.module.js";
import { InternalUsersApiService } from "./internal-users-api.service.js";
import { InternalUsersApiUserController } from "./internal-users-api-user.controller.js";
import { InternalUsersApiDeveloperController } from "./internal-users-api-developer.controller.js";

@Module({
    imports: [UsersApiModule],
    providers: [InternalUsersApiService],
    controllers: [
        InternalUsersApiUserController,
        InternalUsersApiDeveloperController
    ]


})
export class InternalUsersApiModule {

}