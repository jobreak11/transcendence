import { Module } from "@nestjs/common";
import { GameConnectionGateway } from "./game-connection-gateway.js";
import { GameConnectionGatewayService } from "./game-connection-gateway.service.js";
import { AuthModule } from "../../../../modules/auth/auth.module.js";
import { UserModule } from "../../../../modules/user/user.module.js";

@Module({
  imports: [AuthModule, UserModule],
  providers: [GameConnectionGateway, GameConnectionGatewayService],
  exports: [GameConnectionGatewayService]
})
export class GameConnectionGatewayModule {

}