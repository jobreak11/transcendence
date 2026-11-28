import { Module } from "@nestjs/common";
import { InternalFriendsController } from "./internal-friends.controller.js";
import { FriendModule } from "../../../modules/friend/friend.module.js";
import { UserModule } from "../../../modules/user/user.module.js";

@Module({
  controllers: [
    InternalFriendsController
  ],
  imports: [
    FriendModule,
    UserModule
  ]
})
export class InternalFriendsModule {

}