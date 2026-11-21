import { Module } from "@nestjs/common";
import { GameRedisService } from "./game-redis.service.js";
import { LobbyRedisModule } from "../lobby-redis/lobby-redis.module.js";
import { UserRedisModule } from "../user-redis/user-redis.module.js";

@Module({
  imports: [UserRedisModule],
  providers: [GameRedisService],
  exports: [GameRedisService]
})
export class GameRedisModule {

}