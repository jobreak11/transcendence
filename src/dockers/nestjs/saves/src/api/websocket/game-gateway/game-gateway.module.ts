import { Module } from "@nestjs/common";
import { GameGatewayService } from "./game-gameway.service.js";
import { GameGateway } from "./game-gateway.js";
import { GameConnectionGateway } from "./game-connection-gateway/game-connection-gateway.js";
import { GameConnectionGatewayModule } from "./game-connection-gateway/game-connection-gateway.module.js";
import { GameModule } from "../../../modules/game/game.module.js";
import { UserModule } from "../../../modules/user/user.module.js";

@Module({
  imports: [GameConnectionGatewayModule, GameModule, UserModule],
  providers: [GameGatewayService, GameGateway],
  exports: [GameGatewayService]
})
export class GameGatewayModule {

}