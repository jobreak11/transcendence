import { Module } from "@nestjs/common";
import { UserCachingModule } from "./user-caching/user-caching.module.js";
import { FriendshipsCachingModule } from "./friendships-caching/friendships-caching.module.js";

@Module({
  imports: [UserCachingModule, FriendshipsCachingModule],
})
export class CachingModule {

}