import { Module } from "@nestjs/common";
import { LobbyGatewayService } from "./lobby-gateway.service.js";
import { LobbyGateway } from "./lobby.gateway.js";
import { UserModule } from "../../../../modules/user/user.module.js";
import { LobbyModule } from "../../../../modules/lobby/lobby.module.js";

@Module({
  imports: [UserModule, LobbyModule],
  providers: [LobbyGatewayService, LobbyGateway],
  exports: [LobbyGatewayService]
})
export class LobbyGatewayModule {

}
