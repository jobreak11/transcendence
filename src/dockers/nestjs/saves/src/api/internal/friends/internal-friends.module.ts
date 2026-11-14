import { Module } from "@nestjs/common";
import { InternalFriendsController } from "./internal-friends.controller.js";
import { FriendModule } from "../../../modules/friend/friend.module.js";

@Module({
  controllers: [
    InternalFriendsController
  ],
  imports: [
    FriendModule
  ]
})
export class InternalFriendsModule {

}