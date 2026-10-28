import { Module } from "@nestjs/common";
import { GameGatewayService } from "./game-gameway.service.js";
import { GameGateway } from "./game-gateway.js";
import { GameConnectionGateway } from "./game-connection-gateway/game-connection-gateway.js";
import { GameConnectionGatewayModule } from "./game-connection-gateway/game-connection-gateway.module.js";

@Module({
  imports: [GameConnectionGatewayModule],
  providers: [GameGatewayService, GameGateway]
})
export class GameGatewayModule {

}