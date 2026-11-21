import { Module } from "@nestjs/common";
import { UserCachingService } from "./user-caching.service.js";

@Module({
  providers: [UserCachingService],
  exports: [UserCachingService]
})
export class UserCachingModule {

}
