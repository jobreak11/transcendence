import { forwardRef, Module } from "@nestjs/common";
import { InternalLobbyController } from "./internal-lobby.controller.js";
import { LobbyService } from "../../../modules/lobby/lobby.service.js";
import { LobbyModule } from "../../../modules/lobby/lobby.module.js";
import { UserModule } from "../../../modules/user/user.module.js";

@Module({
  imports: [
    LobbyModule,
    UserModule,
  ],
  controllers: [
    InternalLobbyController
  ]
})
export class InternalLobbyModule {

}
