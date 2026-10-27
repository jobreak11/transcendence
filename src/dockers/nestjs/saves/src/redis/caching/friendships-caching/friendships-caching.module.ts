import { Module } from "@nestjs/common";
import { FriendshipsCachingService } from "./friendships-caching.service.js";

@Module({
  providers: [FriendshipsCachingService],
  exports: [FriendshipsCachingService],
})
export class FriendshipsCachingModule {

}