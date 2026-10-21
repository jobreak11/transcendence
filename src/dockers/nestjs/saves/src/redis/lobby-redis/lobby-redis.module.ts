import { Module } from "@nestjs/common";
import { LobbyRedisService } from "./lobby-redis.service.js";

@Module({
  providers: [LobbyRedisService],
  exports: [LobbyRedisService]
})
export class LobbyRedisModule {

}