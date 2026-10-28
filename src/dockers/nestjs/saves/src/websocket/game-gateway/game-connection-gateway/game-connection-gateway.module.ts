import { Module } from "@nestjs/common";
import { GameConnectionGateway } from "./game-connection-gateway.js";
import { GameConnectionGatewayService } from "./game-connection-gateway.service.js";

@Module({
  providers: [GameConnectionGateway, GameConnectionGatewayService]
})
export class GameConnectionGatewayModule {

}