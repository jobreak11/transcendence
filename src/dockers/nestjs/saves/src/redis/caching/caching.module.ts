import { Module } from "@nestjs/common";
import { UserCachingModule } from "./user-caching/user-caching.module.js";

@Module({
  imports: [UserCachingModule],
})
export class CachingModule {

}