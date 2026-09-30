import { Module } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module.js";
import { UserService } from "../user/user.service.js";
import { UserModule } from "../user/user.module.js";
import { MainGateway } from "./mainGateway.js";
import { ChatModule } from "../chat/chat.module.js";
import { MainGatewayService } from "./mainGateway.service.js";

@Module({
  providers: [MainGateway, MainGatewayService],
  imports: [AuthModule, UserModule, ChatModule],
  exports: [MainGatewayService]
})
export class MainGatewayModule {

}